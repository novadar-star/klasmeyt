-- Klasmeyt security hardening + verified sign-up support

-- 1. Sign-up: build the profile from validated user metadata (works with email confirmation on,
--    because the student has no session until they click the link).
create or replace function public.clean_text(v text, max_len int) returns text
language sql immutable set search_path = '' as $$
  select nullif(left(btrim(coalesce(v, '')), max_len), '');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  r public.user_role;
  m jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  s jsonb;
  d int; st time; en time; n int := 0;
begin
  r := case when m->>'role' = 'mentor' then 'mentor'::public.user_role else 'mentee'::public.user_role end;

  insert into public.profiles (id, role, full_name, email, year_level, program, preferred_schedule, about, interests,
                               modality, mentoring_format, intro, academic_experience, skills_achievements, privacy_consent_at)
  values (
    new.id, r,
    coalesce(public.clean_text(m->>'full_name', 120), split_part(new.email, '@', 1)),
    new.email,
    case when m->>'year_level' in ('1st Year','2nd Year','3rd Year','4th Year','5th Year') then m->>'year_level' end,
    public.clean_text(m->>'program', 120),
    public.clean_text(m->>'preferred_schedule', 200),
    public.clean_text(m->>'about', 2000),
    public.clean_text(m->>'interests', 500),
    case when m->>'modality' in ('Online (Teams)','Face-to-face (Campus Library)','Hybrid (Online or Campus Library)') then m->>'modality' end,
    case when r = 'mentor' and m->>'mentoring_format' in ('one_on_one','group','both') then (m->>'mentoring_format')::public.mentoring_format else 'both' end,
    case when r = 'mentor' then public.clean_text(m->>'intro', 2000) end,
    case when r = 'mentor' then public.clean_text(m->>'academic_experience', 2000) end,
    case when r = 'mentor' then public.clean_text(m->>'skills_achievements', 2000) end,
    case when r = 'mentor' and (m->>'privacy_consent') = 'true' then now() end
  );
  insert into public.verifications (user_id, kind, status) values (new.id, r, 'submitted');

  -- subjects: only 1..3
  begin
    insert into public.user_subjects (user_id, subject_id)
    select distinct new.id, (x)::smallint
    from jsonb_array_elements_text(case when jsonb_typeof(m->'subjects') = 'array' then m->'subjects' else '[]'::jsonb end) x
    where x ~ '^[1-3]$';
  exception when others then null; -- never block account creation over optional data
  end;

  -- availability: up to 21 well-formed slots
  if jsonb_typeof(m->'availability') = 'array' then
    for s in select * from jsonb_array_elements(m->'availability') loop
      exit when n >= 21;
      begin
        d := (s->>'day')::int;
        st := (s->>'start_time')::time;
        en := (s->>'end_time')::time;
        if d between 0 and 6 and en > st then
          insert into public.availability (user_id, day, start_time, end_time) values (new.id, d, st, en);
          n := n + 1;
        end if;
      exception when others then null;
      end;
    end loop;
  end if;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- keep profile email in sync if the auth email changes (after the user confirms the change)
create or replace function public.sync_profile_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end $$;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;
create or replace trigger on_auth_user_email_change after update of email on auth.users
  for each row execute function public.sync_profile_email();

-- 2. Verification moves to "pending" only once every required document is uploaded
create or replace function public.has_required_docs(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select case (select role from public.profiles where id = uid)
    when 'mentee' then (select count(distinct type) from public.documents where owner_id = uid and type in ('coe','student_id')) = 2
    when 'mentor' then (select count(distinct type) from public.documents where owner_id = uid and type in ('student_id','academic_record','cv')) = 3
    else false end;
$$;
revoke execute on function public.has_required_docs(uuid) from public, anon;
grant execute on function public.has_required_docs(uuid) to authenticated;

create or replace function public.on_document_uploaded() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.documents where owner_id = new.owner_id) > 20 then
    raise exception 'Upload limit reached. Contact an administrator to remove old files.';
  end if;
  if public.has_required_docs(new.owner_id) then
    update public.verifications set status = 'pending', updated_at = now()
    where user_id = new.owner_id and status in ('submitted', 'info_requested');
  end if;
  return new;
end $$;
revoke execute on function public.on_document_uploaded() from public, anon, authenticated;

-- documents must point at the owner's folder in the private bucket with a sane name
alter table public.documents drop constraint if exists documents_path_format;
alter table public.documents add constraint documents_path_format
  check (path ~ '^[0-9a-f-]{36}/(coe|student_id|academic_record|cv)-[0-9]+\.(pdf|png|jpe?g|webp)$') not valid;
alter table public.documents drop constraint if exists documents_file_name_len;
alter table public.documents add constraint documents_file_name_len check (length(file_name) <= 200) not valid;

-- 3. Length limits on everything people type
alter table public.profiles
  drop constraint if exists profiles_lengths,
  add constraint profiles_lengths check (
    length(full_name) between 1 and 120
    and coalesce(length(program), 0) <= 120
    and coalesce(length(preferred_schedule), 0) <= 200
    and coalesce(length(about), 0) <= 2000
    and coalesce(length(interests), 0) <= 500
    and coalesce(length(intro), 0) <= 2000
    and coalesce(length(academic_experience), 0) <= 2000
    and coalesce(length(skills_achievements), 0) <= 2000
    and coalesce(length(vouched_by), 0) <= 120
    and coalesce(length(modality), 0) <= 60
  ) not valid;
alter table public.partnership_requests drop constraint if exists requests_message_len,
  add constraint requests_message_len check (coalesce(length(message), 0) <= 1000) not valid;
alter table public.mentoring_groups drop constraint if exists groups_name_len,
  add constraint groups_name_len check (length(name) between 1 and 80) not valid;
alter table public.sessions drop constraint if exists sessions_notes_len,
  add constraint sessions_notes_len check (coalesce(length(notes), 0) <= 1000) not valid;
alter table public.verifications drop constraint if exists verifications_note_len,
  add constraint verifications_note_len check (coalesce(length(reviewer_note), 0) <= 1000) not valid;

-- 4. Meeting links must be real Microsoft Teams links (blocks phishing links in sessions)
create or replace function public.check_teams_link() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.teams_link is not null and new.teams_link !~* '^https://([a-z0-9-]+\.)*(teams\.microsoft\.com|teams\.live\.com)/[^\s<>"]*$' then
    raise exception 'Use a Microsoft Teams meeting link (it starts with https://teams.microsoft.com or https://teams.live.com).';
  end if;
  return new;
end $$;
create or replace trigger check_teams_link before insert or update of teams_link on public.sessions
  for each row execute function public.check_teams_link();

-- 5. Verified mentors can't quietly add subjects they weren't approved for (FR-A12).
--    Removing a subject is still allowed. Mentees and applicants edit freely.
alter policy "user_subjects own insert" on public.user_subjects with check (
  user_id = auth.uid() and not (public.my_role() = 'mentor' and public.is_verified(auth.uid()))
);
create policy "user_subjects admin manage" on public.user_subjects for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- 6. Abuse limits
create or replace function public.limit_requests() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.partnership_requests where mentee_id = new.mentee_id and status = 'pending') >= 5 then
    raise exception 'You have 5 pending requests. Wait for a reply or withdraw one before sending another.';
  end if;
  return new;
end $$;
revoke execute on function public.limit_requests() from public, anon, authenticated;
create or replace trigger limit_requests before insert on public.partnership_requests
  for each row execute function public.limit_requests();

create or replace function public.limit_availability() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.availability where user_id = new.user_id) >= 21 then
    raise exception 'You can add up to 21 time slots.';
  end if;
  return new;
end $$;
revoke execute on function public.limit_availability() from public, anon, authenticated;
create or replace trigger limit_availability before insert on public.availability
  for each row execute function public.limit_availability();

create or replace function public.limit_messages() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.messages where sender_id = new.sender_id and created_at > now() - interval '1 minute') >= 30 then
    raise exception 'You''re sending messages too quickly. Wait a moment and try again.';
  end if;
  return new;
end $$;
revoke execute on function public.limit_messages() from public, anon, authenticated;
create or replace trigger limit_messages before insert on public.messages
  for each row execute function public.limit_messages();

-- 7. Notifications: users may only flip "read"; nothing else about a notification is theirs to change
create or replace function public.protect_notification() returns trigger
language plpgsql set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.user_id := old.user_id; new.type := old.type; new.title := old.title;
    new.body := old.body; new.link := old.link; new.created_at := old.created_at;
  end if;
  return new;
end $$;
create or replace trigger protect_notification before update on public.notifications
  for each row execute function public.protect_notification();

-- 8. FR-C10: "session starting soon" reminders, every 5 minutes via pg_cron
alter table public.sessions add column if not exists reminder_sent_at timestamptz;

create or replace function public.send_session_reminders() returns int
language plpgsql security definer set search_path = '' as $$
declare s record; n int := 0; u uuid; t text;
begin
  for s in
    select * from public.sessions
    where status = 'scheduled' and reminder_sent_at is null
      and starts_at > now() and starts_at <= now() + interval '60 minutes'
    for update skip locked
  loop
    t := to_char(s.starts_at at time zone 'Asia/Manila', 'HH12:MI AM');
    for u in select s.mentor_id union select mentee_id from public.session_participants where session_id = s.id and response = 'confirmed' loop
      perform public.notify(u, 'session', 'Session starting soon', 'Your ' || (select name from public.subjects where id = s.subject_id) || ' session starts at ' || t || '. Join from Sessions.', '/sessions');
    end loop;
    update public.sessions set reminder_sent_at = now() where id = s.id;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke execute on function public.send_session_reminders() from public, anon, authenticated;

create extension if not exists pg_cron;
do $$ begin
  if not exists (select 1 from cron.job where jobname = 'klasmeyt-session-reminders') then
    perform cron.schedule('klasmeyt-session-reminders', '*/5 * * * *', 'select public.send_session_reminders()');
  end if;
end $$;

-- 9. Belt and braces: no table is writable by anon, and helper functions stay private
revoke insert, update, delete on all tables in schema public from anon;
revoke execute on function public.clean_text(text, int) from public, anon, authenticated;
