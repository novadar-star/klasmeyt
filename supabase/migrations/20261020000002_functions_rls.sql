-- Klasmeyt: helpers, triggers, RLS, RPCs

-- ---------- helpers ----------
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.my_role() returns public.user_role
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_verified(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.verifications where user_id = uid and status = 'verified');
$$;

create or replace function public.is_group_mentor(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.mentoring_groups where id = gid and mentor_id = auth.uid());
$$;

create or replace function public.is_active_member(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.group_members where group_id = gid and mentee_id = auth.uid() and status = 'active');
$$;

create or replace function public.is_group_participant(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_group_mentor(gid) or public.is_active_member(gid)
      or exists (select 1 from public.group_members where group_id = gid and mentee_id = auth.uid() and status = 'invited');
$$;

-- caller and uid are connected through a request or a group
create or replace function public.is_connected(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.partnership_requests r
    where (r.mentee_id = auth.uid() and r.mentor_id = uid) or (r.mentor_id = auth.uid() and r.mentee_id = uid)
  ) or exists (
    select 1 from public.mentoring_groups g
    join public.group_members m on m.group_id = g.id
    where (g.mentor_id = auth.uid() and m.mentee_id = uid)
       or (g.mentor_id = uid and m.mentee_id = auth.uid())
       or (m.mentee_id = uid and exists (select 1 from public.group_members m2 where m2.group_id = g.id and m2.mentee_id = auth.uid() and m2.status = 'active'))
  );
$$;

create or replace function public.notify(p_user uuid, p_type text, p_title text, p_body text, p_link text)
returns void language sql security definer set search_path = '' as $$
  insert into public.notifications (user_id, type, title, body, link) values (p_user, p_type, p_title, p_body, p_link);
$$;
revoke execute on function public.notify(uuid,text,text,text,text) from public, anon, authenticated;

-- ---------- new user ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare r public.user_role;
begin
  r := case when new.raw_user_meta_data->>'role' = 'mentor' then 'mentor'::public.user_role else 'mentee'::public.user_role end;
  insert into public.profiles (id, role, full_name, email)
  values (new.id, r, coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1)), new.email);
  insert into public.verifications (user_id, kind, status) values (new.id, r, 'submitted');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- protect admin-only profile fields ----------
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.vouched_by := old.vouched_by;
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger protect_profile before update on public.profiles
  for each row execute function public.protect_profile();

-- ---------- documents move status to pending ----------
create or replace function public.on_document_uploaded() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.verifications set status = 'pending', updated_at = now()
  where user_id = new.owner_id and status in ('submitted','info_requested');
  return new;
end $$;
create trigger on_document_uploaded after insert on public.documents
  for each row execute function public.on_document_uploaded();

-- ---------- verification changes ----------
create or replace function public.on_verification_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare label text;
begin
  if new.status is distinct from old.status then
    new.updated_at := now();
    if auth.uid() is not null and public.is_admin() then
      new.reviewed_by := auth.uid();
      new.reviewed_at := now();
    end if;
    label := case new.status
      when 'verified' then case when new.kind = 'mentor' then 'Your mentor application was approved' else 'Your account is verified' end
      when 'rejected' then case when new.kind = 'mentor' then 'Your mentor application was rejected' else 'Your verification was rejected' end
      when 'info_requested' then 'Additional information requested'
      when 'under_review' then 'An administrator is reviewing your documents'
      else null end;
    if label is not null then
      perform public.notify(new.user_id, 'verification', label, new.reviewer_note, '/status');
    end if;
  end if;
  return new;
end $$;
create trigger on_verification_change before update on public.verifications
  for each row execute function public.on_verification_change();

-- ---------- request notifications ----------
create or replace function public.on_request_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare n text; s text;
begin
  select full_name into n from public.profiles where id = new.mentee_id;
  select name into s from public.subjects where id = new.subject_id;
  perform public.notify(new.mentor_id, 'request', 'New partnership request', n || ' wants help with ' || s, '/requests');
  return new;
end $$;
create trigger on_request_insert after insert on public.partnership_requests
  for each row execute function public.on_request_insert();

-- ---------- message notifications (one unread per chat) ----------
create or replace function public.on_message_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare g record; n text; v_link text; u uuid;
begin
  select * into g from public.mentoring_groups where id = new.group_id;
  select full_name into n from public.profiles where id = new.sender_id;
  v_link := '/chat/' || new.group_id;
  for u in
    select g.mentor_id union select gm.mentee_id from public.group_members gm where gm.group_id = new.group_id and gm.status = 'active'
  loop
    if u <> new.sender_id and not exists (
      select 1 from public.notifications nt where nt.user_id = u and nt.type = 'message' and nt.link = v_link and nt.read = false
    ) then
      perform public.notify(u, 'message', 'New message in ' || g.name, n || ': ' || left(new.body, 80), v_link);
    end if;
  end loop;
  return new;
end $$;
create trigger on_message_insert after insert on public.messages
  for each row execute function public.on_message_insert();

-- ---------- RLS ----------
alter table public.subjects enable row level security;
alter table public.profiles enable row level security;
alter table public.verifications enable row level security;
alter table public.user_subjects enable row level security;
alter table public.availability enable row level security;
alter table public.documents enable row level security;
alter table public.mentoring_groups enable row level security;
alter table public.group_members enable row level security;
alter table public.partnership_requests enable row level security;
alter table public.messages enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.notifications enable row level security;

create policy "subjects readable" on public.subjects for select to anon, authenticated using (true);

create policy "profiles select" on public.profiles for select to authenticated using (
  id = auth.uid() or public.is_admin()
  or (role = 'mentor' and public.is_verified(id))
  or public.is_connected(id)
);
create policy "profiles update own" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

create policy "verifications select" on public.verifications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy "verifications admin update" on public.verifications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "user_subjects select" on public.user_subjects for select to authenticated using (true);
create policy "user_subjects own insert" on public.user_subjects for insert to authenticated with check (user_id = auth.uid());
create policy "user_subjects own delete" on public.user_subjects for delete to authenticated using (user_id = auth.uid());

create policy "availability select" on public.availability for select to authenticated using (true);
create policy "availability own insert" on public.availability for insert to authenticated with check (user_id = auth.uid());
create policy "availability own update" on public.availability for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "availability own delete" on public.availability for delete to authenticated using (user_id = auth.uid());

-- documents: owner + admin; verified mentees may see a verified mentor's CV (FR-M4)
create policy "documents select" on public.documents for select to authenticated using (
  owner_id = auth.uid() or public.is_admin()
  or (type = 'cv' and public.is_verified(owner_id) and public.is_verified(auth.uid()))
);
create policy "documents own insert" on public.documents for insert to authenticated
  with check (owner_id = auth.uid() and split_part(path, '/', 1) = auth.uid()::text);
create policy "documents own delete" on public.documents for delete to authenticated using (owner_id = auth.uid());

create policy "groups select" on public.mentoring_groups for select to authenticated
  using (mentor_id = auth.uid() or public.is_group_participant(id) or public.is_admin());
create policy "groups mentor rename" on public.mentoring_groups for update to authenticated
  using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());

create policy "members select" on public.group_members for select to authenticated
  using (mentee_id = auth.uid() or public.is_group_mentor(group_id) or public.is_active_member(group_id) or public.is_admin());

create policy "requests select" on public.partnership_requests for select to authenticated
  using (mentee_id = auth.uid() or mentor_id = auth.uid() or public.is_admin());
create policy "requests mentee insert" on public.partnership_requests for insert to authenticated with check (
  mentee_id = auth.uid() and status = 'pending' and group_id is null
  and public.my_role() = 'mentee' and public.is_verified(auth.uid()) and public.is_verified(mentor_id)
  and exists (select 1 from public.profiles p where p.id = mentor_id and p.role = 'mentor')
  and exists (select 1 from public.user_subjects us where us.user_id = mentor_id and us.subject_id = partnership_requests.subject_id)
);

create policy "messages select" on public.messages for select to authenticated using (
  public.is_group_mentor(group_id)
  or exists (select 1 from public.group_members m where m.group_id = messages.group_id and m.mentee_id = auth.uid()
             and m.status = 'active' and messages.created_at >= m.joined_at)
);
create policy "messages insert" on public.messages for insert to authenticated with check (
  sender_id = auth.uid() and (public.is_group_mentor(group_id) or public.is_active_member(group_id))
);

create or replace function public.can_see_session(sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.sessions s where s.id = sid and s.mentor_id = auth.uid())
      or exists (select 1 from public.session_participants sp where sp.session_id = sid and sp.mentee_id = auth.uid())
      or public.is_admin();
$$;
create policy "sessions select" on public.sessions for select to authenticated using (public.can_see_session(id));
create policy "participants select" on public.session_participants for select to authenticated using (public.can_see_session(session_id));

create policy "notifications own select" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications own update" on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "notifications own delete" on public.notifications for delete to authenticated using (user_id = auth.uid());
