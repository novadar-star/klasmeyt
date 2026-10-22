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

Sign-up is email-verified: the account is created with the student's profile, subjects, and availability, but nothing else works until they click the link in the confirmation email. Documents chosen during sign-up stay in that browser and upload automatically after they confirm.

Set these in the Supabase dashboard before going live:

1. **Sign In / Providers → Email:** keep **Confirm email ON**. Turn on **Secure email change**.
2. **URL Configuration:** Site URL = your Vercel URL (e.g. `https://klasmeyt.vercel.app`). Add Redirect URLs `https://klasmeyt.vercel.app/**` and `http://localhost:3000/**`.
3. **Emails → SMTP Settings:** turn on **custom SMTP**. Supabase's built-in sender only delivers to your own team's addresses and about 2 emails an hour, so real students won't get confirmation emails without it. Free options: Brevo (300/day, verify a single sender) or a Gmail account with an App Password (`smtp.gmail.com`, port 587).
4. **Policies → Password:** minimum length **8**, require **letters and digits** (the app checks the same rules).
5. **Rate Limits:** keep the defaults (they throttle sign-up, login, and email sends).
6. Optional on the Pro plan: **Leaked password protection** (HaveIBeenPwned) and **CAPTCHA** (Turnstile) on sign-up.

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
