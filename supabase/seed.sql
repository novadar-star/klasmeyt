-- Klasmeyt demo data. Password for every demo account: Klasmeyt2026!
-- Safe to re-run: deletes the demo accounts first.

create or replace function pg_temp.mk_user(p_email text, p_name text, p_role text) returns uuid
language plpgsql as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current,
    phone_change, phone_change_token, reauthentication_token)
  values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_email,
    crypt('Klasmeyt2026!', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', p_name, 'role', case when p_role = 'mentor' then 'mentor' else 'mentee' end),
    now(), now(), '', '', '', '', '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text, jsonb_build_object('sub', uid::text, 'email', p_email, 'email_verified', true), 'email', now(), now(), now());
  if p_role = 'admin' then
    update public.profiles set role = 'admin' where id = uid;
    update public.verifications set kind = 'admin', status = 'verified' where user_id = uid;
  end if;
  return uid;
end $$;

delete from auth.users where email like '%@demo.klasmeyt.app' or email = 'admin@klasmeyt.app';

do $$
declare
  admin uuid; dhennise uuid; carmel uuid; john uuid; elena uuid;
  kenneth uuid; andrea uuid; paolo uuid; juan uuid;
  g1 uuid; g2 uuid; s1 uuid; s2 uuid; s3 uuid;
begin
  admin    := pg_temp.mk_user('admin@klasmeyt.app', 'Klasmeyt Admin', 'admin');
  dhennise := pg_temp.mk_user('dhennise.maala@demo.klasmeyt.app', 'Dhennise B. Maala', 'mentor');
  carmel   := pg_temp.mk_user('carmel.bautista@demo.klasmeyt.app', 'Carmel A. Bautista', 'mentor');
  john     := pg_temp.mk_user('john.sanchez@demo.klasmeyt.app', 'John Benedict Sanchez', 'mentor');
  elena    := pg_temp.mk_user('elena.robles@demo.klasmeyt.app', 'Ma. Elena Robles', 'mentor');
  kenneth  := pg_temp.mk_user('kenneth.guardiano@demo.klasmeyt.app', 'Kenneth Cairo R. Guardiano', 'mentee');
  andrea   := pg_temp.mk_user('andrea.lim@demo.klasmeyt.app', 'Andrea Mae Lim', 'mentee');
  paolo    := pg_temp.mk_user('paolo.reyes@demo.klasmeyt.app', 'Paolo Miguel Reyes', 'mentee');
  juan     := pg_temp.mk_user('juan.delacruz@demo.klasmeyt.app', 'Juan Dela Cruz', 'mentee');

  -- mentors
  update public.profiles set year_level = '4th Year', program = 'BS Civil Engineering', mentoring_format = 'both', modality = 'Hybrid (Online or Campus Library)',
    preferred_schedule = 'Tuesday & Thursday afternoons', vouched_by = 'Engr. Reyes', privacy_consent_at = now(),
    intro = 'Hi! I''m a 4th year Civil Engineering student who topped Calculus 1 and 2. Happy to walk you through limits, derivatives, and integration step by step.',
    about = 'Civil Engineering senior who loves turning scary formulas into simple steps.',
    academic_experience = E'• Calculus 1: 1.25, Calculus 2: 1.25\n• Peer tutor for the CE department review sessions (1 year)',
    skills_achievements = 'Integration techniques, related rates, optimization problems. Dean''s Lister 3 semesters.',
    interests = 'Structural analysis, math competitions' where id = dhennise;
  update public.profiles set year_level = '4th Year', program = 'BS Chemical Engineering', mentoring_format = 'both', modality = 'Online (Teams)',
    preferred_schedule = 'Mon / Wed / Fri, 3:00 PM onwards', vouched_by = 'Engr. Marvales', privacy_consent_at = now(),
    intro = 'Senior ChE student focused on making Physics and Calculus 2 click. I use lots of worked examples and practice sets.',
    about = 'Dedicated to helping underclassmen pass their math and physics prerequisites.',
    academic_experience = E'• Physics 1: 1.0, Calculus 2: 1.5\n• Consistent top scorer in ChE department integration exams',
    skills_achievements = 'Kinematics, Newton''s laws, work-energy, series and sequences.',
    interests = 'Process modeling, thermodynamics' where id = carmel;
  update public.profiles set year_level = '3rd Year', program = 'BS Civil Engineering', mentoring_format = 'one_on_one', modality = 'Face-to-face (Campus Library)', privacy_consent_at = now(),
    intro = 'I passed Calculus 1 with a 1.5 and want to help freshmen get through it.', preferred_schedule = 'Weekday mornings' where id = john;
  update public.profiles set year_level = '4th Year', program = 'BS Chemical Engineering', mentoring_format = 'group', modality = 'Online (Teams)', privacy_consent_at = now(),
    intro = 'Physics enthusiast, ready to run group problem-solving sessions.', preferred_schedule = 'Saturdays' where id = elena;

  -- mentees
  update public.profiles set year_level = '2nd Year', program = 'BS Chemical Engineering', modality = 'Hybrid (Online or Campus Library)', preferred_schedule = 'Tue/Thu after 2 PM, Fridays',
    about = 'Determined ChE Falcon trying to master Calculus 2 before finals.', interests = 'Process design, chemical thermodynamics' where id = kenneth;
  update public.profiles set year_level = '1st Year', program = 'BS Computer Engineering', modality = 'Online (Teams)', preferred_schedule = 'Thursday afternoons',
    about = 'Freshman who needs help with integration by parts.', interests = 'Game development' where id = andrea;
  update public.profiles set year_level = '2nd Year', program = 'BS Electronics Engineering', modality = 'Online (Teams)', preferred_schedule = 'Mon/Wed after 3 PM',
    about = 'Physics is my weakest subject this sem.', interests = 'Robotics' where id = paolo;
  update public.profiles set year_level = '1st Year', program = 'BS Civil Engineering', modality = 'Face-to-face (Campus Library)', preferred_schedule = 'Mondays & Wednesdays (2:00 PM – 5:00 PM)',
    about = 'Hello, I''m Juan, struggling with limits in Calculus 1.', interests = 'Passing Calculus 1' where id = juan;

  insert into public.user_subjects values (dhennise,1),(dhennise,2),(carmel,2),(carmel,3),(john,1),(elena,3),(kenneth,2),(andrea,2),(paolo,3),(juan,1);
  insert into public.availability (user_id, day, start_time, end_time) values
    (dhennise,2,'13:00','17:00'),(dhennise,4,'13:00','17:00'),
    (carmel,1,'15:00','17:30'),(carmel,3,'15:00','17:30'),(carmel,5,'15:00','17:30'),
    (john,1,'08:00','11:00'),(john,3,'08:00','11:00'),
    (elena,6,'09:00','12:00'),
    (kenneth,2,'14:00','17:00'),(kenneth,4,'14:00','17:00'),(kenneth,5,'13:00','17:00'),
    (andrea,4,'13:00','16:00'),
    (paolo,1,'15:00','18:00'),(paolo,3,'15:00','18:00'),
    (juan,1,'14:00','17:00'),(juan,3,'14:00','17:00');

  -- verification states (bypass notifications for seed)
  alter table public.verifications disable trigger on_verification_change;
  update public.verifications set status = 'verified', reviewed_by = admin, reviewed_at = now() - interval '5 days' where user_id in (dhennise, carmel, kenneth, andrea, paolo);
  update public.verifications set status = 'pending' where user_id in (john, juan);
  update public.verifications set status = 'info_requested', reviewer_note = 'Please upload your official grades for Physics. The screenshot is cropped.', reviewed_by = admin, reviewed_at = now() - interval '1 day' where user_id = elena;
  alter table public.verifications enable trigger on_verification_change;

  -- Kenneth <-> Dhennise: accepted one-on-one, Calculus 2
  insert into public.mentoring_groups (mentor_id, subject_id, kind, name, created_at) values (dhennise, 2, 'individual', 'Calculus 2: Kenneth Cairo R. Guardiano', now() - interval '6 days') returning id into g1;
  insert into public.group_members values (g1, kenneth, 'active', now() - interval '6 days', now() - interval '6 days');
  insert into public.partnership_requests (mentee_id, mentor_id, subject_id, message, status, group_id, created_at, responded_at) values
    (kenneth, dhennise, 2, 'Hello! I''m a ChE student needing guidance in Calculus 2, especially integration techniques. Your Tuesday/Thursday afternoon schedule fits mine perfectly. Hope you can accept my request!', 'accepted', g1, now() - interval '7 days', now() - interval '6 days');

  alter table public.messages disable trigger on_message_insert;
  insert into public.messages (group_id, sender_id, body, created_at) values
    (g1, dhennise, 'Hi Kenneth! Welcome. What topics in Calculus 2 are giving you the most trouble?', now() - interval '6 days'),
    (g1, kenneth, 'Hi Ate Dhennise! Mostly integration by parts and trig substitution.', now() - interval '6 days' + interval '20 minutes'),
    (g1, dhennise, 'Got it. Let''s start with integration by parts on Thursday. Try the LIATE problems in our module before then.', now() - interval '6 days' + interval '35 minutes'),
    (g1, kenneth, 'Will do, thank you!', now() - interval '6 days' + interval '40 minutes'),
    (g1, dhennise, 'Great work today. Next session we''ll do trig substitution. I scheduled it for Thursday.', now() - interval '4 days');
  alter table public.messages enable trigger on_message_insert;

  -- past completed + upcoming scheduled session
  insert into public.sessions (group_id, mentor_id, subject_id, proposed_by, starts_at, duration_min, format, teams_link, notes, status, mentor_confirmed, created_at)
    values (g1, dhennise, 2, dhennise, '2026-10-15 14:00:00+08', 120, 'individual', 'https://teams.microsoft.com/l/meetup-join/demo-klasmeyt-001', 'Integration by parts', 'completed', true, now() - interval '6 days') returning id into s1;
  insert into public.session_participants values (s1, kenneth, 'confirmed', now() - interval '6 days');
  insert into public.sessions (group_id, mentor_id, subject_id, proposed_by, starts_at, duration_min, format, teams_link, notes, status, mentor_confirmed, created_at)
    values (g1, dhennise, 2, dhennise, '2026-10-22 14:00:00+08', 120, 'individual', 'https://teams.microsoft.com/l/meetup-join/demo-klasmeyt-002', 'Trig substitution & exam strategy', 'scheduled', true, now() - interval '4 days') returning id into s2;
  insert into public.session_participants values (s2, kenneth, 'confirmed', now() - interval '3 days');

  -- Carmel's Physics group with Paolo, pending group session
  insert into public.mentoring_groups (mentor_id, subject_id, kind, name, created_at) values (carmel, 3, 'group', 'Physics Problem Solving Circle', now() - interval '3 days') returning id into g2;
  insert into public.group_members values (g2, paolo, 'active', now() - interval '3 days', now() - interval '3 days');
  insert into public.partnership_requests (mentee_id, mentor_id, subject_id, message, status, group_id, created_at, responded_at) values
    (paolo, carmel, 3, 'Hi! I''d love help with kinematics and Newton''s laws. Group sessions are fine with me.', 'accepted', g2, now() - interval '4 days', now() - interval '3 days');
  insert into public.sessions (group_id, mentor_id, subject_id, proposed_by, starts_at, duration_min, format, teams_link, notes, status, mentor_confirmed, created_at)
    values (g2, carmel, 3, carmel, '2026-10-26 15:00:00+08', 90, 'group', 'https://teams.microsoft.com/l/meetup-join/demo-klasmeyt-003', 'Free-body diagrams practice set', 'pending', true, now() - interval '1 day') returning id into s3;
  insert into public.session_participants values (s3, paolo, 'pending', null);

  -- pending request for live demo: Andrea -> Dhennise (Calculus 2)
  insert into public.partnership_requests (mentee_id, mentor_id, subject_id, message) values
    (andrea, dhennise, 2, 'Hi! I''m a freshman struggling with integration by parts. Thursday afternoons work best for me. Hope you can help!');

  -- a few notifications so the page isn't empty
  insert into public.notifications (user_id, type, title, body, link, read, created_at) values
    (kenneth, 'verification', 'Your account is verified', null, '/status', true, now() - interval '8 days'),
    (kenneth, 'request', 'Request accepted', 'Dhennise B. Maala accepted your Calculus 2 request', '/partners', true, now() - interval '6 days'),
    (kenneth, 'session', 'Session scheduled', 'Your session on Oct 22, 02:00 PM is confirmed', '/sessions', false, now() - interval '3 days'),
    (paolo, 'session', 'Session invitation', 'Carmel A. Bautista proposed a session for Oct 26, 03:00 PM', '/sessions', false, now() - interval '1 day'),
    (dhennise, 'verification', 'Your mentor application was approved', null, '/status', true, now() - interval '9 days');
end $$;
