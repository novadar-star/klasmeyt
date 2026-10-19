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

## Required Supabase setting

Authentication → Sign In / Providers → Email → turn **off "Confirm email"**.
Registration uploads documents right after sign-up, which needs a session immediately.
(The free tier also only sends ~2 auth emails/hour, which would break a live demo.)

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
