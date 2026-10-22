-- Name, email, role, vouched-by and consent time are identity/verification fields: only admins change them.
create or replace function public.protect_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.id := old.id;
    new.role := old.role;
    new.vouched_by := old.vouched_by;
    new.email := old.email;
    new.full_name := old.full_name;
    new.created_at := old.created_at;
    new.privacy_consent_at := coalesce(old.privacy_consent_at, case when new.privacy_consent_at is not null then now() end);
  end if;
  new.updated_at := now();
  return new;
end $$;
revoke execute on function public.protect_profile() from public, anon, authenticated;
revoke update on public.documents from authenticated;
revoke update on public.verifications from anon;

create or replace function public.clean_text(v text, max_len int) returns text
language sql immutable set search_path = '' as $$
  select nullif(left(btrim(regexp_replace(coalesce(v, ''), '[ \t]+', ' ', 'g')), max_len), '');
$$;
revoke execute on function public.clean_text(text, int) from public, anon, authenticated;
revoke execute on function public.has_required_docs(uuid) from authenticated;
