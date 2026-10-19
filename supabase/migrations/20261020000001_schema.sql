-- Klasmeyt schema: core tables
create extension if not exists pgcrypto;

create type public.user_role as enum ('mentee','mentor','admin');
create type public.verification_status as enum ('submitted','pending','under_review','verified','info_requested','rejected');
create type public.doc_type as enum ('coe','student_id','academic_record','cv');
create type public.request_status as enum ('pending','accepted','declined','cancelled');
create type public.group_kind as enum ('individual','group');
create type public.member_status as enum ('invited','active','left');
create type public.mentoring_format as enum ('one_on_one','group','both');
create type public.session_status as enum ('pending','scheduled','completed','cancelled');
create type public.rsvp as enum ('pending','confirmed','declined');

create table public.subjects (
  id smallint primary key,
  name text not null unique
);
insert into public.subjects (id, name) values (1,'Calculus 1'),(2,'Calculus 2'),(3,'Physics');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  email text not null,
  year_level text,
  program text,
  about text,
  interests text,
  preferred_schedule text,
  mentoring_format public.mentoring_format default 'both',
  -- mentor application fields
  intro text,
  academic_experience text,
  skills_achievements text,
  vouched_by text,
  privacy_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verifications (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  kind public.user_role not null,
  status public.verification_status not null default 'submitted',
  reviewer_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.user_subjects (
  user_id uuid references public.profiles(id) on delete cascade,
  subject_id smallint references public.subjects(id),
  primary key (user_id, subject_id)
);

create table public.availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  day smallint not null check (day between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index on public.availability(user_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type public.doc_type not null,
  path text not null unique,
  file_name text,
  uploaded_at timestamptz not null default now()
);
create index on public.documents(owner_id);

create table public.mentoring_groups (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  subject_id smallint not null references public.subjects(id),
  kind public.group_kind not null default 'individual',
  name text not null,
  created_at timestamptz not null default now()
);
create index on public.mentoring_groups(mentor_id);

create table public.group_members (
  group_id uuid references public.mentoring_groups(id) on delete cascade,
  mentee_id uuid references public.profiles(id) on delete cascade,
  status public.member_status not null default 'active',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  primary key (group_id, mentee_id)
);
create index on public.group_members(mentee_id);

create table public.partnership_requests (
  id uuid primary key default gen_random_uuid(),
  mentee_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  subject_id smallint not null references public.subjects(id),
  message text,
  status public.request_status not null default 'pending',
  group_id uuid references public.mentoring_groups(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);
create index on public.partnership_requests(mentor_id);
create index on public.partnership_requests(mentee_id);
create unique index one_open_request on public.partnership_requests(mentee_id, mentor_id, subject_id) where status = 'pending';

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mentoring_groups(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  created_at timestamptz not null default now()
);
create index on public.messages(group_id, created_at);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.mentoring_groups(id) on delete cascade,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  subject_id smallint not null references public.subjects(id),
  proposed_by uuid not null references public.profiles(id),
  starts_at timestamptz not null,
  duration_min int not null check (duration_min between 15 and 480),
  format public.group_kind not null,
  teams_link text,
  notes text,
  status public.session_status not null default 'pending',
  mentor_confirmed boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.sessions(group_id);
create index on public.sessions(starts_at);

create table public.session_participants (
  session_id uuid references public.sessions(id) on delete cascade,
  mentee_id uuid references public.profiles(id) on delete cascade,
  response public.rsvp not null default 'pending',
  responded_at timestamptz,
  primary key (session_id, mentee_id)
);
create index on public.session_participants(mentee_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.notifications(user_id, created_at desc);
