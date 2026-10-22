# Klasmeyt

Peer mentoring platform for Adamson University students (Calculus 1, Calculus 2, Physics).
Next.js 14 (App Router, TypeScript, Tailwind) + Supabase (Auth, Postgres with RLS, Storage, Realtime).

## Run locally

```bash
npm install
cp .env.example .env.local   # already points at the klasmeyt Supabase project
npm run dev                  # http://localhost:3000
```

## Deploy (Vercel)

1. Import the repo in Vercel.
2. Add env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (values in `.env.example`).
3. Deploy. In Supabase → Authentication → URL Configuration, set **Site URL** to the Vercel URL.

## Required Supabase settings (Authentication)

Per the SRS (FR-C10 and "Not included"), v1 sends **no emails or SMS**. Accounts are verified by an administrator reviewing the COE/Student ID (mentees) or Student ID, grades, and CV (mentors), not by email.

1. **Sign In / Providers → Email:** turn **Confirm email OFF**. Sign-up then creates the account, saves the profile, and uploads the documents in one step.
2. **URL Configuration:** Site URL = your Vercel URL (e.g. `https://klasmeyt.vercel.app`).
3. **Policies → Password:** minimum length **8**, require **letters and digits** (the app checks the same rules).
4. **Rate Limits:** keep the defaults.

**Forgotten passwords:** an administrator sets a temporary password in the Supabase SQL editor, tells the student privately, and the student changes it in Profile:

```sql
update auth.users set encrypted_password = crypt('TempPass123', gen_salt('bf')), updated_at = now()
where email = 'student@adamson.edu.ph';
```

**Adding email later (future version / quoted separately):** configure custom SMTP (e.g. Brevo free tier), turn Confirm email ON, add `https://<site>/**` to Redirect URLs, and set `NEXT_PUBLIC_EMAIL_ENABLED=true` in Vercel. The confirmation flow, `/auth/callback`, and the forgot/reset password pages are already built and switch on with that flag.

## Session workflow (client-confirmed, SRS §9)

1. **Propose:** the mentor picks the group, sees the subject and format set by the partnership, picks a duration and adds the Teams link. Dates and times come only from the **agreed schedule**: the mentee's free hours when they sent the request, intersected with the mentor's free hours when they accepted it (`agreed_windows`). For a group, every mentee's agreed hours must overlap. Later profile edits don't change an agreed schedule. The database rejects any time outside it (`schedule_session`).
2. **Invite:** each mentee gets a notification and answers **Confirm attendance** or **Cannot attend**.
3. **Pending confirmation** while anyone hasn't answered.
4. **Finalize when everyone has answered:** all confirmed, it's scheduled automatically. Nobody can attend, it's cancelled and the mentor is asked to propose another time. Mixed answers, the mentor sees who's coming and chooses **Proceed with N confirmed** or **Propose another time** (the new proposal replaces the old one).
5. **Calendar:** the scheduled session shows for the mentor and the mentees who confirmed. Mentees who can't attend don't get it on their calendar.

One-on-one partnerships still let the mentee propose a time (FR-C5); the mentor confirms it and adds the Teams link.

## Security model

- **Row-level security on every table.** Users only read their own data, their partners', and verified mentor profiles. Admins can't read chats.
- **Admin-only fields** (role, verification status, Vouched By, full name, email) can't be changed through the API by students, even with crafted requests.
- **Private documents bucket** (PDF/PNG/JPG/WEBP, 10 MB). Paths are forced into the owner's folder. Only the owner and admins can open files; verified mentees can open a verified mentor's CV (FR-M4).
- **Verification gates:** an account moves to "pending" only after every required document is uploaded. Only verified mentees can search or send requests; only verified mentors appear in search. Verified mentors can't self-add subjects.
- **Workflow actions** (accept request, propose/confirm/cancel session, group invites) run as database functions that check who's calling.
- **Meeting links** must be Microsoft Teams URLs, so a session can't carry a phishing link.
- **Abuse limits:** 5 pending requests per mentee, 30 messages a minute, 21 availability slots, 20 files per user, text length caps.
- **Web:** strict security headers (CSP, frame blocking, HSTS, nosniff), same-site redirects only, logout of other devices after a password reset.

## Demo accounts (password `Klasmeyt2026!`)

| Role | Email | State |
|---|---|---|
| Admin | admin@klasmeyt.app | — |
| Mentor | dhennise.maala@demo.klasmeyt.app | Verified, Calc 1 & 2, has a pending request from Andrea |
| Mentor | carmel.bautista@demo.klasmeyt.app | Verified, Calc 2 & Physics, runs a Physics group |
| Mentor | john.sanchez@demo.klasmeyt.app | Application pending |
| Mentor | elena.robles@demo.klasmeyt.app | More info requested |
| Mentee | kenneth.guardiano@demo.klasmeyt.app | Verified, partnered with Dhennise, chat + scheduled session |
| Mentee | andrea.lim@demo.klasmeyt.app | Verified, request pending with Dhennise |
| Mentee | paolo.reyes@demo.klasmeyt.app | Verified, in Carmel's group, group session awaiting his response |
| Mentee | juan.delacruz@demo.klasmeyt.app | Pending verification |

Seeded accounts have no uploaded files. Register a fresh mentee/mentor live to demo uploads and admin review.

## Creating more admin accounts (FR-D1)

Sign up normally, then in the Supabase SQL editor:

```sql
update public.profiles set role = 'admin' where email = 'new.admin@example.com';
update public.verifications set kind = 'admin', status = 'verified' where user_id = (select id from public.profiles where email = 'new.admin@example.com');
```

## Database

`supabase/migrations/` holds the schema, RLS policies, triggers, and workflow functions:

- `respond_request` — mentor accepts (one-on-one / existing group / new group) or declines
- `invite_to_group`, `respond_group_invite` — group invites with the join notice (FR-M11)
- `propose_session`, `respond_session`, `finalize_session`, `cancel_session`, `complete_session` — session flow with availability checks in Manila time
- `search_mentors` — verified mentors filtered by subject, year, format, day, and overlap with the mentee's availability
- `admin_overview` — dashboard counts
- Triggers create in-app notifications for verification changes, requests, groups, messages, and sessions.

`supabase/seed.sql` recreates the demo data.

## Handover

Move to the client's own accounts: create their Supabase project, run the migrations then `seed.sql` (optional), update the two env vars in Vercel, and transfer the Vercel project / GitHub repo.
