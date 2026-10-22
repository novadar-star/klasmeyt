-- Klasmeyt serves Adamson engineering students only (client decision). Keep in sync with PROGRAMS in src/components/form-bits.tsx.
create or replace function public.engineering_programs()
returns text[] language sql immutable set search_path = '' as $$
  select array[
    'BS Ceramic Engineering', 'BS Chemical Engineering', 'BS Civil Engineering', 'BS Computer Engineering',
    'BS Electrical Engineering', 'BS Electronics Engineering', 'BS Environmental and Sanitary Engineering',
    'BS Industrial Engineering', 'BS Mechanical Engineering', 'BS Mining Engineering'
  ];
$$;

create or replace function public.check_program()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.program is not null and not (new.program = any(public.engineering_programs())) then
    raise exception 'Klasmeyt is for Adamson engineering students. Choose your engineering program from the list.';
  end if;
  return new;
end $$;
revoke execute on function public.check_program() from public, anon, authenticated;

create or replace trigger check_program before insert or update of program on public.profiles
  for each row execute function public.check_program();

-- demo data: the one non-engineering demo mentee
update public.profiles set program = 'BS Computer Engineering' where program = 'BS Computer Science';
