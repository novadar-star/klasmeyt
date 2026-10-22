-- Session workflow agreed with the client (SRS §9, "Group sessions"):
-- 1. The mentor proposes a session only inside the schedule agreed when each partnership was accepted.
-- 2-3. Mentees confirm attendance or say they can't attend; the session stays "pending confirmation" meanwhile.
-- 4. Once everyone has responded the session finalizes: all confirmed -> scheduled, nobody -> cancelled,
--    mixed -> the mentor proceeds with the confirmed mentees or proposes another time.
-- 5. Only the mentor and mentees who confirmed see it as scheduled on their calendar (handled in the app).

-- ---------------------------------------------------------------------------
-- Agreed schedule: the mentee's free hours when they sent the request,
-- intersected with the mentor's free hours when they accepted it.
-- ---------------------------------------------------------------------------
alter table public.partnership_requests add column if not exists mentee_slots jsonb;

create table if not exists public.agreed_windows (
  request_id uuid not null references public.partnership_requests(id) on delete cascade,
  day smallint not null check (day between 0 and 6),
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index if not exists agreed_windows_request_idx on public.agreed_windows(request_id);
alter table public.agreed_windows enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'agreed_windows' and policyname = 'agreed windows select') then
    create policy "agreed windows select" on public.agreed_windows for select to authenticated using (
      exists (select 1 from public.partnership_requests r where r.id = request_id and (r.mentee_id = auth.uid() or r.mentor_id = auth.uid()))
      or public.is_admin()
    );
  end if;
end $$;
revoke insert, update, delete on public.agreed_windows from anon, authenticated;

-- Snapshot the mentee's availability at request time (the client can't supply or forge it).
create or replace function public.snapshot_request_slots()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.mentee_slots := (
    select coalesce(jsonb_agg(jsonb_build_object('day', a.day, 'start', a.start_time, 'end', a.end_time)), '[]'::jsonb)
    from public.availability a where a.user_id = new.mentee_id
  );
  return new;
end $$;
revoke execute on function public.snapshot_request_slots() from public, anon, authenticated;
create or replace trigger snapshot_request_slots before insert on public.partnership_requests
  for each row execute function public.snapshot_request_slots();

-- Intersect with the mentor's availability at acceptance.
create or replace function public.record_agreed_windows(p_request uuid)
returns void language sql security definer set search_path = '' as $$
  delete from public.agreed_windows where request_id = p_request;
  insert into public.agreed_windows (request_id, day, start_time, end_time)
  select r.id, (s->>'day')::smallint,
         greatest((s->>'start')::time, a.start_time), least((s->>'end')::time, a.end_time)
  from public.partnership_requests r
  cross join lateral jsonb_array_elements(coalesce(r.mentee_slots, '[]'::jsonb)) s
  join public.availability a on a.user_id = r.mentor_id and a.day = (s->>'day')::smallint
  where r.id = p_request
    and greatest((s->>'start')::time, a.start_time) < least((s->>'end')::time, a.end_time);
$$;
revoke execute on function public.record_agreed_windows(uuid) from public, anon, authenticated;

create or replace function public.on_request_accepted()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'accepted' and old.status is distinct from 'accepted' then
    perform public.record_agreed_windows(new.id);
  end if;
  return new;
end $$;
revoke execute on function public.on_request_accepted() from public, anon, authenticated;
create or replace trigger on_request_accepted after update of status on public.partnership_requests
  for each row execute function public.on_request_accepted();

-- Backfill: existing requests get today's availability as their snapshot.
update public.partnership_requests r set mentee_slots = (
  select coalesce(jsonb_agg(jsonb_build_object('day', a.day, 'start', a.start_time, 'end', a.end_time)), '[]'::jsonb)
  from public.availability a where a.user_id = r.mentee_id
) where r.mentee_slots is null;
do $$ declare rid uuid; begin
  for rid in select pr.id from public.partnership_requests pr where pr.status = 'accepted'
    and not exists (select 1 from public.agreed_windows w where w.request_id = pr.id) loop
    perform public.record_agreed_windows(rid);
  end loop;
end $$;

-- The accepted request that links a mentee to a mentoring group (same mentor + subject, latest first).
create or replace function public.agreed_request(p_group uuid, p_mentee uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select r.id from public.partnership_requests r
  join public.mentoring_groups g on g.id = p_group
  where r.mentor_id = g.mentor_id and r.mentee_id = p_mentee and r.subject_id = g.subject_id and r.status = 'accepted'
  order by r.responded_at desc nulls last, r.created_at desc limit 1;
$$;
revoke execute on function public.agreed_request(uuid, uuid) from public, anon, authenticated;

-- Names of active mentees whose agreed schedule does NOT cover the slot (null = everyone fits).
create or replace function public.outside_agreed(p_group uuid, p_start timestamptz, p_minutes int)
returns text language sql stable security definer set search_path = '' as $$
  with t as (select (p_start at time zone 'Asia/Manila') as s, (p_start at time zone 'Asia/Manila') + make_interval(mins => p_minutes) as e)
  select string_agg(p.full_name, ', ' order by p.full_name)
  from public.group_members gm
  join public.profiles p on p.id = gm.mentee_id
  cross join t
  where gm.group_id = p_group and gm.status = 'active'
    and not exists (
      select 1 from public.agreed_windows w
      where w.request_id = public.agreed_request(p_group, gm.mentee_id)
        and w.day = extract(dow from t.s)::int
        and w.start_time <= t.s::time and w.end_time >= t.e::time
        and t.e::date = t.s::date
    );
$$;
revoke execute on function public.outside_agreed(uuid, timestamptz, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Propose a session (replaces the availability check with the agreed schedule).
-- p_replaces: the mentor's earlier pending proposal this one supersedes ("propose another session").
-- ---------------------------------------------------------------------------
create or replace function public.schedule_session(
  p_group uuid, p_starts_at timestamptz, p_duration int,
  p_teams_link text default null, p_notes text default null, p_replaces uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare g public.mentoring_groups; sid uuid; is_mentor boolean; m record; who text; bad text; old public.sessions;
begin
  select * into g from public.mentoring_groups where id = p_group;
  if g.id is null then raise exception 'Partnership not found'; end if;
  is_mentor := g.mentor_id = auth.uid();
  if not is_mentor then
    if not exists (select 1 from public.group_members where group_id = g.id and mentee_id = auth.uid() and status = 'active') then
      raise exception 'Not a member of this partnership'; end if;
    if g.kind = 'group' then raise exception 'Only the mentor schedules group sessions'; end if;
  end if;
  if p_duration not in (30, 60, 90, 120, 180) then raise exception 'Choose a duration from the list'; end if;
  if p_starts_at < now() then raise exception 'Pick a future date and time'; end if;
  if is_mentor and coalesce(trim(p_teams_link), '') = '' then raise exception 'Add the Microsoft Teams link'; end if;
  if length(coalesce(p_notes, '')) > 1000 then raise exception 'Notes are too long (1,000 characters max)'; end if;
  if not exists (select 1 from public.group_members where group_id = g.id and status = 'active') then
    raise exception 'No active mentees in this partnership yet'; end if;

  bad := public.outside_agreed(g.id, p_starts_at, p_duration);
  if bad is not null then raise exception 'That time is outside the schedule agreed with: %', bad; end if;

  if p_replaces is not null then
    select * into old from public.sessions where id = p_replaces for update;
    if old.id is null or old.group_id <> g.id or old.status <> 'pending' or old.proposed_by <> auth.uid() then
      raise exception 'The session you are replacing is no longer pending'; end if;
    update public.sessions set status = 'cancelled' where id = old.id;
  end if;

  insert into public.sessions (group_id, mentor_id, subject_id, proposed_by, starts_at, duration_min, format, teams_link, notes, mentor_confirmed)
    values (g.id, g.mentor_id, g.subject_id, auth.uid(), p_starts_at, p_duration, g.kind, nullif(trim(p_teams_link), ''), nullif(trim(p_notes), ''), is_mentor)
    returning id into sid;
  insert into public.session_participants (session_id, mentee_id, response, responded_at)
    select sid, gm.mentee_id,
           case when gm.mentee_id = auth.uid() then 'confirmed'::public.rsvp else 'pending'::public.rsvp end,
           case when gm.mentee_id = auth.uid() then now() end
    from public.group_members gm where gm.group_id = g.id and gm.status = 'active';

  select full_name into who from public.profiles where id = auth.uid();
  if is_mentor then
    for m in select mentee_id from public.group_members where group_id = g.id and status = 'active' loop
      perform public.notify(m.mentee_id, 'session',
        case when old.id is not null then 'New session time proposed' else 'Session invitation' end,
        who || ' proposed a session for ' || to_char(p_starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM') || '. Confirm attendance or tell them you can''t attend.',
        '/sessions');
    end loop;
  else
    perform public.notify(g.mentor_id, 'session', 'Session proposed',
      who || ' proposed a session for ' || to_char(p_starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM'), '/sessions');
  end if;
  return sid;
end $$;
revoke execute on function public.schedule_session(uuid, timestamptz, int, text, text, uuid) from public, anon;
grant execute on function public.schedule_session(uuid, timestamptz, int, text, text, uuid) to authenticated;

-- Old entry point keeps working and follows the same rules.
create or replace function public.propose_session(p_group uuid, p_starts_at timestamptz, p_duration integer, p_teams_link text default null, p_notes text default null)
returns uuid language sql security definer set search_path = '' as $$
  select public.schedule_session(p_group, p_starts_at, p_duration, p_teams_link, p_notes, null);
$$;

-- ---------------------------------------------------------------------------
-- Respond to an invitation. A group session finalizes when the last mentee responds.
-- ---------------------------------------------------------------------------
create or replace function public.respond_session(p_session uuid, p_accept boolean, p_teams_link text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.sessions; who text; pending_left int; yes int; no int; m record; at text;
begin
  select * into s from public.sessions where id = p_session for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if s.status <> 'pending' then raise exception 'Session is no longer pending'; end if;
  select full_name into who from public.profiles where id = auth.uid();
  at := to_char(s.starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM');

  -- mentor answering a mentee's one-on-one proposal
  if s.mentor_id = auth.uid() then
    if not p_accept then
      update public.sessions set status = 'cancelled' where id = s.id;
      perform public.notify(sp.mentee_id, 'session', 'Session declined', who || ' could not make the proposed time', '/sessions')
        from public.session_participants sp where sp.session_id = s.id;
      return;
    end if;
    if coalesce(trim(coalesce(p_teams_link, s.teams_link)), '') = '' then raise exception 'Add the Microsoft Teams link'; end if;
    update public.sessions set mentor_confirmed = true, teams_link = coalesce(nullif(trim(p_teams_link), ''), teams_link) where id = s.id;
    perform public.maybe_schedule(s.id);
    return;
  end if;

  update public.session_participants
    set response = case when p_accept then 'confirmed'::public.rsvp else 'declined'::public.rsvp end, responded_at = now()
    where session_id = s.id and mentee_id = auth.uid() and response = 'pending';
  if not found then
    if exists (select 1 from public.session_participants where session_id = s.id and mentee_id = auth.uid()) then
      raise exception 'You already responded to this invitation'; end if;
    raise exception 'You are not invited to this session';
  end if;

  if s.format = 'individual' then
    if not p_accept then
      update public.sessions set status = 'cancelled' where id = s.id;
      perform public.notify(s.mentor_id, 'session', who || ' cannot attend', 'The session on ' || at || ' was cancelled. Propose another time.', '/sessions/new?group=' || s.group_id);
      return;
    end if;
    perform public.maybe_schedule(s.id);
    return;
  end if;

  -- group session
  select count(*) filter (where response = 'pending'), count(*) filter (where response = 'confirmed'), count(*) filter (where response = 'declined')
    into pending_left, yes, no
    from public.session_participants where session_id = s.id;

  if pending_left > 0 then
    perform public.notify(s.mentor_id, 'session',
      case when p_accept then who || ' confirmed attendance' else who || ' cannot attend' end,
      pending_left || ' mentee(s) still to respond for ' || at, '/sessions');
  elsif no = 0 then
    -- everyone confirmed: finalize
    update public.sessions set status = 'scheduled' where id = s.id;
    perform public.notify(s.mentor_id, 'session', 'Session scheduled', 'Every mentee confirmed the session on ' || at, '/calendar');
    for m in select mentee_id from public.session_participants where session_id = s.id loop
      perform public.notify(m.mentee_id, 'session', 'Session scheduled', 'The group session on ' || at || ' is confirmed', '/calendar');
    end loop;
  elsif yes = 0 then
    -- nobody can attend: close it so the mentor proposes another time
    update public.sessions set status = 'cancelled' where id = s.id;
    perform public.notify(s.mentor_id, 'session', 'No one can attend', 'Nobody can make ' || at || '. Propose another time.', '/sessions/new?group=' || s.group_id);
    for m in select mentee_id from public.session_participants where session_id = s.id loop
      perform public.notify(m.mentee_id, 'session', 'Session cancelled', 'The group session on ' || at || ' was cancelled', '/sessions');
    end loop;
  else
    perform public.notify(s.mentor_id, 'session', 'Everyone responded',
      yes || ' confirmed, ' || no || ' cannot attend. Proceed with the confirmed mentees or propose another time.', '/sessions');
  end if;
end $$;

-- Mentor's decision once everyone responded and some can't attend.
create or replace function public.finalize_session(p_session uuid, p_proceed boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare s public.sessions; m record; at text;
begin
  select * into s from public.sessions where id = p_session for update;
  if s.id is null or s.mentor_id <> auth.uid() then raise exception 'Session not found'; end if;
  if s.status <> 'pending' then raise exception 'Session is no longer pending'; end if;
  at := to_char(s.starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM');
  if p_proceed then
    if exists (select 1 from public.session_participants where session_id = s.id and response = 'pending') then
      raise exception 'Wait until every mentee has responded'; end if;
    if not exists (select 1 from public.session_participants where session_id = s.id and response = 'confirmed') then
      raise exception 'No mentee confirmed. Propose another time.'; end if;
    update public.sessions set status = 'scheduled' where id = s.id;
  else
    update public.sessions set status = 'cancelled' where id = s.id;
  end if;
  for m in select mentee_id, response from public.session_participants where session_id = s.id loop
    if p_proceed and m.response = 'confirmed' then
      perform public.notify(m.mentee_id, 'session', 'Session scheduled', 'The group session on ' || at || ' is confirmed', '/calendar');
    elsif p_proceed then
      perform public.notify(m.mentee_id, 'session', 'Session going ahead', 'The group session on ' || at || ' will go ahead without you', '/sessions');
    else
      perform public.notify(m.mentee_id, 'session', 'Session cancelled', 'The proposed group session on ' || at || ' was cancelled', '/sessions');
    end if;
  end loop;
end $$;
