-- Klasmeyt: workflow RPCs, storage, realtime

-- Mentor responds to a partnership request.
-- p_mode: 'individual' (private chat), 'existing_group' (invite into p_group), 'new_group' (create group named p_group_name)
create or replace function public.respond_request(p_request uuid, p_accept boolean, p_mode text default 'individual', p_group uuid default null, p_group_name text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare r public.partnership_requests; gid uuid; mname text; sname text; mentor_name text; g public.mentoring_groups;
begin
  select * into r from public.partnership_requests where id = p_request for update;
  if r.id is null or r.mentor_id <> auth.uid() then raise exception 'Request not found'; end if;
  if r.status <> 'pending' then raise exception 'Request already answered'; end if;
  select full_name into mname from public.profiles where id = r.mentee_id;
  select full_name into mentor_name from public.profiles where id = r.mentor_id;
  select name into sname from public.subjects where id = r.subject_id;

  if not p_accept then
    update public.partnership_requests set status = 'declined', responded_at = now() where id = r.id;
    perform public.notify(r.mentee_id, 'request', 'Request declined', mentor_name || ' declined your ' || sname || ' request', '/requests');
    return null;
  end if;

  if p_mode = 'existing_group' then
    select * into g from public.mentoring_groups where id = p_group and mentor_id = auth.uid();
    if g.id is null then raise exception 'Group not found'; end if;
    if g.subject_id <> r.subject_id then raise exception 'Group subject does not match the request'; end if;
    update public.mentoring_groups set kind = 'group' where id = g.id;
    gid := g.id;
    insert into public.group_members (group_id, mentee_id, status) values (gid, r.mentee_id, 'invited')
      on conflict (group_id, mentee_id) do update set status = 'invited', invited_at = now();
    perform public.notify(r.mentee_id, 'group', 'Request accepted: you were added to a group', mentor_name || ' invited you to "' || g.name || '"', '/partners');
  elsif p_mode = 'new_group' then
    insert into public.mentoring_groups (mentor_id, subject_id, kind, name)
      values (auth.uid(), r.subject_id, 'group', coalesce(nullif(trim(p_group_name),''), sname || ' Group'))
      returning id into gid;
    insert into public.group_members (group_id, mentee_id, status, joined_at) values (gid, r.mentee_id, 'active', now());
    perform public.notify(r.mentee_id, 'request', 'Request accepted', mentor_name || ' accepted your ' || sname || ' request', '/partners');
  else
    insert into public.mentoring_groups (mentor_id, subject_id, kind, name)
      values (auth.uid(), r.subject_id, 'individual', sname || ': ' || mname)
      returning id into gid;
    insert into public.group_members (group_id, mentee_id, status, joined_at) values (gid, r.mentee_id, 'active', now());
    perform public.notify(r.mentee_id, 'request', 'Request accepted', mentor_name || ' accepted your ' || sname || ' request', '/partners');
  end if;

  update public.partnership_requests set status = 'accepted', responded_at = now(), group_id = gid where id = r.id;
  return gid;
end $$;

-- Mentee cancels own pending request
create or replace function public.cancel_request(p_request uuid) returns void
language sql security definer set search_path = '' as $$
  update public.partnership_requests set status = 'cancelled', responded_at = now()
  where id = p_request and mentee_id = auth.uid() and status = 'pending';
$$;

-- Mentor adds an already-accepted mentee into another group (invite)
create or replace function public.invite_to_group(p_group uuid, p_mentee uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare g public.mentoring_groups; mentor_name text;
begin
  select * into g from public.mentoring_groups where id = p_group and mentor_id = auth.uid();
  if g.id is null then raise exception 'Group not found'; end if;
  if not exists (select 1 from public.partnership_requests where mentor_id = auth.uid() and mentee_id = p_mentee and subject_id = g.subject_id and status = 'accepted') then
    raise exception 'This mentee has no accepted partnership with you for this subject';
  end if;
  select full_name into mentor_name from public.profiles where id = auth.uid();
  update public.mentoring_groups set kind = 'group' where id = g.id;
  insert into public.group_members (group_id, mentee_id, status) values (g.id, p_mentee, 'invited')
    on conflict (group_id, mentee_id) do update set status = 'invited', invited_at = now();
  perform public.notify(p_mentee, 'group', 'You were added to a group', mentor_name || ' invited you to "' || g.name || '"', '/partners');
end $$;

-- Mentee accepts/declines a group invite (FR-M11). Declining falls back to a private chat.
create or replace function public.respond_group_invite(p_group uuid, p_accept boolean) returns uuid
language plpgsql security definer set search_path = '' as $$
declare g public.mentoring_groups; gid uuid; mname text; sname text;
begin
  select * into g from public.mentoring_groups where id = p_group;
  if not exists (select 1 from public.group_members where group_id = p_group and mentee_id = auth.uid() and status = 'invited') then
    raise exception 'No pending invite';
  end if;
  if p_accept then
    update public.group_members set status = 'active', joined_at = now() where group_id = p_group and mentee_id = auth.uid();
    insert into public.messages (group_id, sender_id, body)
      select p_group, auth.uid(), full_name || ' joined the group' from public.profiles where id = auth.uid();
    return p_group;
  end if;
  update public.group_members set status = 'left' where group_id = p_group and mentee_id = auth.uid();
  -- keep the partnership: give them a private chat with the mentor if they don't have one
  select gg.id into gid from public.mentoring_groups gg join public.group_members m on m.group_id = gg.id
    where gg.mentor_id = g.mentor_id and gg.subject_id = g.subject_id and gg.kind = 'individual' and m.mentee_id = auth.uid() and m.status = 'active' limit 1;
  if gid is null then
    select full_name into mname from public.profiles where id = auth.uid();
    select name into sname from public.subjects where id = g.subject_id;
    insert into public.mentoring_groups (mentor_id, subject_id, kind, name) values (g.mentor_id, g.subject_id, 'individual', sname || ': ' || mname) returning id into gid;
    insert into public.group_members (group_id, mentee_id, status, joined_at) values (gid, auth.uid(), 'active', now());
  end if;
  perform public.notify(g.mentor_id, 'group', 'Group invite declined', (select full_name from public.profiles where id = auth.uid()) || ' chose a private chat instead of "' || g.name || '"', '/chat/' || gid);
  return gid;
end $$;

-- availability check in Manila time
create or replace function public.fits_availability(p_user uuid, p_start timestamptz, p_minutes int) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.availability a
    where a.user_id = p_user
      and a.day = extract(dow from (p_start at time zone 'Asia/Manila'))::int
      and a.start_time <= (p_start at time zone 'Asia/Manila')::time
      and a.end_time >= ((p_start at time zone 'Asia/Manila') + make_interval(mins => p_minutes))::time
      and ((p_start at time zone 'Asia/Manila') + make_interval(mins => p_minutes))::date = (p_start at time zone 'Asia/Manila')::date
  );
$$;

-- Propose a session. Mentor can propose for any of their groups; a mentee only for their individual partnership.
create or replace function public.propose_session(p_group uuid, p_starts_at timestamptz, p_duration int, p_teams_link text default null, p_notes text default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare g public.mentoring_groups; sid uuid; is_mentor boolean; m record; who text; bad text;
begin
  select * into g from public.mentoring_groups where id = p_group;
  if g.id is null then raise exception 'Chat not found'; end if;
  is_mentor := g.mentor_id = auth.uid();
  if not is_mentor then
    if not exists (select 1 from public.group_members where group_id = g.id and mentee_id = auth.uid() and status = 'active') then
      raise exception 'Not a member of this partnership'; end if;
    if g.kind = 'group' then raise exception 'Only the mentor schedules group sessions'; end if;
  end if;
  if p_starts_at < now() then raise exception 'Pick a future date and time'; end if;
  if is_mentor and coalesce(trim(p_teams_link),'') = '' then raise exception 'Add the Microsoft Teams link'; end if;
  if coalesce(trim(p_teams_link),'') <> '' and p_teams_link !~* '^https://' then raise exception 'Teams link must start with https://'; end if;
  if not exists (select 1 from public.group_members where group_id = g.id and status = 'active') then
    raise exception 'No active mentees in this chat yet'; end if;

  -- schedule compatibility (mentor + every active mentee)
  if not public.fits_availability(g.mentor_id, p_starts_at, p_duration) then
    raise exception 'That time is outside the mentor''s availability'; end if;
  select string_agg(p.full_name, ', ') into bad from public.group_members gm join public.profiles p on p.id = gm.mentee_id
    where gm.group_id = g.id and gm.status = 'active' and not public.fits_availability(gm.mentee_id, p_starts_at, p_duration);
  if bad is not null then raise exception 'That time is outside the availability of: %', bad; end if;

  insert into public.sessions (group_id, mentor_id, subject_id, proposed_by, starts_at, duration_min, format, teams_link, notes, mentor_confirmed)
    values (g.id, g.mentor_id, g.subject_id, auth.uid(), p_starts_at, p_duration, g.kind, nullif(trim(p_teams_link),''), p_notes, is_mentor)
    returning id into sid;
  insert into public.session_participants (session_id, mentee_id, response, responded_at)
    select sid, gm.mentee_id, case when gm.mentee_id = auth.uid() then 'confirmed'::public.rsvp else 'pending'::public.rsvp end,
           case when gm.mentee_id = auth.uid() then now() end
    from public.group_members gm where gm.group_id = g.id and gm.status = 'active';

  select full_name into who from public.profiles where id = auth.uid();
  if is_mentor then
    for m in select mentee_id from public.group_members where group_id = g.id and status = 'active' loop
      perform public.notify(m.mentee_id, 'session', 'Session invitation', who || ' proposed a session for ' ||
        to_char(p_starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM'), '/sessions');
    end loop;
  else
    perform public.notify(g.mentor_id, 'session', 'Session proposed', who || ' proposed a session for ' ||
      to_char(p_starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM'), '/sessions');
  end if;
  return sid;
end $$;

-- internal: finalize individual sessions automatically
create or replace function public.maybe_schedule(p_session uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.sessions; m record;
begin
  select * into s from public.sessions where id = p_session;
  if s.status <> 'pending' or not s.mentor_confirmed or s.teams_link is null then return; end if;
  if s.format = 'individual' and not exists (select 1 from public.session_participants where session_id = s.id and response <> 'confirmed') then
    update public.sessions set status = 'scheduled' where id = s.id;
    perform public.notify(s.mentor_id, 'session', 'Session scheduled', 'Your session on ' || to_char(s.starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM') || ' is confirmed', '/sessions');
    for m in select mentee_id from public.session_participants where session_id = s.id loop
      perform public.notify(m.mentee_id, 'session', 'Session scheduled', 'Your session on ' || to_char(s.starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM') || ' is confirmed', '/sessions');
    end loop;
  end if;
end $$;
revoke execute on function public.maybe_schedule(uuid) from public, anon, authenticated;

-- Respond to a pending session.
-- Mentee: confirm attendance / cannot attend. Mentor: confirm (with Teams link) / decline a mentee-proposed session.
create or replace function public.respond_session(p_session uuid, p_accept boolean, p_teams_link text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.sessions; who text; pending_left int;
begin
  select * into s from public.sessions where id = p_session for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if s.status <> 'pending' then raise exception 'Session is no longer pending'; end if;
  select full_name into who from public.profiles where id = auth.uid();

  if s.mentor_id = auth.uid() then
    if not p_accept then
      update public.sessions set status = 'cancelled' where id = s.id;
      perform public.notify(sp.mentee_id, 'session', 'Session declined', who || ' could not make the proposed time', '/sessions')
        from public.session_participants sp where sp.session_id = s.id;
      return;
    end if;
    if coalesce(trim(coalesce(p_teams_link, s.teams_link)),'') = '' then raise exception 'Add the Microsoft Teams link'; end if;
    if coalesce(p_teams_link, s.teams_link) !~* '^https://' then raise exception 'Teams link must start with https://'; end if;
    update public.sessions set mentor_confirmed = true, teams_link = coalesce(nullif(trim(p_teams_link),''), teams_link) where id = s.id;
  else
    update public.session_participants set response = case when p_accept then 'confirmed'::public.rsvp else 'declined'::public.rsvp end, responded_at = now()
      where session_id = s.id and mentee_id = auth.uid();
    if not found then raise exception 'You are not invited to this session'; end if;
    if s.format = 'individual' and not p_accept then
      update public.sessions set status = 'cancelled' where id = s.id;
      perform public.notify(s.mentor_id, 'session', 'Session declined', who || ' cannot attend the proposed session', '/sessions');
      return;
    end if;
    if s.format = 'group' then
      select count(*) into pending_left from public.session_participants where session_id = s.id and response = 'pending';
      perform public.notify(s.mentor_id, 'session',
        case when p_accept then who || ' confirmed attendance' else who || ' cannot attend' end,
        case when pending_left = 0 then 'All mentees have responded. Review and finalize the session.' else pending_left || ' mentee(s) still to respond' end,
        '/sessions');
    end if;
  end if;
  perform public.maybe_schedule(s.id);
end $$;

-- Mentor finalizes a group session after responses (proceed with confirmed attendees or cancel)
create or replace function public.finalize_session(p_session uuid, p_proceed boolean) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.sessions; m record;
begin
  select * into s from public.sessions where id = p_session for update;
  if s.id is null or s.mentor_id <> auth.uid() then raise exception 'Session not found'; end if;
  if s.status <> 'pending' then raise exception 'Session is no longer pending'; end if;
  if p_proceed then
    if exists (select 1 from public.session_participants where session_id = s.id and response = 'pending') then
      raise exception 'Wait until every mentee has responded'; end if;
    if not exists (select 1 from public.session_participants where session_id = s.id and response = 'confirmed') then
      raise exception 'No mentee confirmed. Cancel and propose another time.'; end if;
    update public.sessions set status = 'scheduled' where id = s.id;
  else
    update public.sessions set status = 'cancelled' where id = s.id;
  end if;
  for m in select mentee_id, response from public.session_participants where session_id = s.id loop
    if p_proceed and m.response = 'confirmed' then
      perform public.notify(m.mentee_id, 'session', 'Session scheduled', 'Group session on ' || to_char(s.starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM') || ' is confirmed', '/sessions');
    elsif not p_proceed then
      perform public.notify(m.mentee_id, 'session', 'Session cancelled', 'The proposed group session was cancelled', '/sessions');
    end if;
  end loop;
end $$;

-- Either side cancels a pending/scheduled session
create or replace function public.cancel_session(p_session uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare s public.sessions; who text; u uuid;
begin
  select * into s from public.sessions where id = p_session for update;
  if s.id is null then raise exception 'Session not found'; end if;
  if s.mentor_id <> auth.uid() and not (s.proposed_by = auth.uid() and s.status = 'pending') then
    raise exception 'Only the mentor (or the mentee who proposed it, while pending) can cancel'; end if;
  if s.status not in ('pending','scheduled') then raise exception 'Session cannot be cancelled'; end if;
  update public.sessions set status = 'cancelled' where id = s.id;
  select full_name into who from public.profiles where id = auth.uid();
  for u in select s.mentor_id union select mentee_id from public.session_participants where session_id = s.id loop
    if u <> auth.uid() then
      perform public.notify(u, 'session', 'Session cancelled', who || ' cancelled the session on ' || to_char(s.starts_at at time zone 'Asia/Manila', 'Mon DD, HH12:MI AM'), '/sessions');
    end if;
  end loop;
end $$;

-- Mentor marks a past session as completed
create or replace function public.complete_session(p_session uuid) returns void
language sql security definer set search_path = '' as $$
  update public.sessions set status = 'completed'
  where id = p_session and mentor_id = auth.uid() and status = 'scheduled';
$$;

-- Admin overview counts (FR-D2)
create or replace function public.admin_overview() returns json
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'Admins only'; end if;
  return json_build_object(
    'mentees', (select count(*) from public.profiles where role = 'mentee'),
    'mentor_applicants', (select count(*) from public.profiles where role = 'mentor'),
    'pending_applications', (select count(*) from public.verifications where kind = 'mentor' and status in ('submitted','pending','under_review','info_requested')),
    'pending_mentees', (select count(*) from public.verifications where kind = 'mentee' and status in ('submitted','pending','under_review','info_requested')),
    'verified_mentors', (select count(*) from public.verifications where kind = 'mentor' and status = 'verified'),
    'verified_mentees', (select count(*) from public.verifications where kind = 'mentee' and status = 'verified'),
    'active_partnerships', (select count(*) from public.partnership_requests where status = 'accepted'),
    'groups', (select count(*) from public.mentoring_groups where kind = 'group'),
    'upcoming_sessions', (select count(*) from public.sessions where status in ('pending','scheduled') and starts_at > now())
  );
end $$;

-- Lock down function execution to signed-in users
do $$ declare f text; begin
  foreach f in array array[
    'respond_request(uuid,boolean,text,uuid,text)','cancel_request(uuid)','invite_to_group(uuid,uuid)',
    'respond_group_invite(uuid,boolean)','propose_session(uuid,timestamptz,int,text,text)',
    'respond_session(uuid,boolean,text)','finalize_session(uuid,boolean)','cancel_session(uuid)',
    'complete_session(uuid)','admin_overview()','fits_availability(uuid,timestamptz,int)'
  ] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ---------- storage: private documents bucket ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create policy "docs upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "docs read" on storage.objects for select to authenticated using (
  bucket_id = 'documents' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.is_admin()
    or exists (select 1 from public.documents d where d.path = storage.objects.name and d.type = 'cv'
               and public.is_verified(d.owner_id) and public.is_verified(auth.uid()))
  )
);
create policy "docs delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- realtime ----------
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
