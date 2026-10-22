import Link from "next/link";
import { CalendarDays, ChevronRight } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { myGroups, notAttending, profilesById, sessionsFor } from "@/lib/queries";
import { Card, CardTitle, PageHeader, Stat } from "@/components/ui";
import { Badge } from "@/components/badges";
import { fmtClock, fmtDate, sessionStatus, subjectName, DAYS, fmtTime } from "@/lib/utils";
import type { Slot } from "@/lib/types";

export const metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const { supabase, profile, verified } = await requireMe();
  const first = profile.full_name.split(" ")[0];
  const [{ data: subs }, { data: slots }, sessions] = await Promise.all([
    supabase.from("user_subjects").select("subject_id").eq("user_id", profile.id),
    supabase.from("availability").select("*").eq("user_id", profile.id).order("day").order("start_time"),
    sessionsFor(supabase),
  ]);
  const subjects = (subs ?? []).map((s) => s.subject_id as number);
  const upcoming = sessions.filter((s) => ["pending", "scheduled"].includes(sessionStatus(s)) && new Date(s.starts_at) > new Date() && !notAttending(s, profile.id));
  const next = upcoming.find((s) => s.status === "scheduled") ?? upcoming[0];
  const people = await profilesById(supabase, next ? [next.mentor_id, ...next.participants.map((p) => p.mentee_id)] : []);

  const nextCard = (
    <Card className="p-5">
      <CardTitle>Next session</CardTitle>
      {next ? (
        <Link href="/sessions" className="press block rounded-control bg-paper p-4 ring-1 ring-inset ring-line hover:ring-brand-300 active:scale-[0.99]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-brand-800">{subjectName(next.subject_id)} {next.format === "group" ? "group session" : "session"}</p>
            {next.status === "pending" ? <Badge color="pad">Pending confirmation</Badge> : <Badge color="blue">Scheduled</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-muted">
            {profile.role === "mentor"
              ? `With ${next.participants.map((p) => people[p.mentee_id]?.full_name.split(" ")[0]).filter(Boolean).join(", ")}`
              : `With ${people[next.mentor_id]?.full_name ?? "your mentor"}`}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink">
            <CalendarDays className="size-3.5 text-muted" aria-hidden /> {fmtDate(next.starts_at)}, {fmtClock(next.starts_at)} – {fmtClock(new Date(new Date(next.starts_at).getTime() + next.duration_min * 60000).toISOString())}
          </p>
        </Link>
      ) : (
        <p className="text-sm text-muted">
          No upcoming sessions. {profile.role === "mentor" ? "Schedule one from My mentees." : "Once a mentor accepts you, schedule one from My study partners."}
        </p>
      )}
    </Card>
  );

  if (profile.role === "mentor") {
    const [{ count: pending }, groups] = await Promise.all([
      supabase.from("partnership_requests").select("id", { count: "exact", head: true }).eq("mentor_id", profile.id).eq("status", "pending"),
      myGroups(supabase, profile.id, "mentor"),
    ]);
    const mentees = new Set(groups.flatMap((g) => g.members.filter((m) => m.status === "active").map((m) => m.mentee_id)));
    return (
      <>
        <PageHeader title={`Welcome, ${first}`} description={[profile.year_level, profile.program, "verified mentor"].filter(Boolean).join(", ")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/requests" className="press rounded-panel active:scale-[0.98] hover:[&>div]:border-brand-300"><Stat label="Requests waiting for you" value={pending ?? 0} /></Link>
          <Link href="/mentees" className="press rounded-panel active:scale-[0.98] hover:[&>div]:border-brand-300"><Stat label="Active mentees" value={mentees.size} /></Link>
          <Link href="/subjects" className="press rounded-panel active:scale-[0.98] hover:[&>div]:border-brand-300"><Stat label="Subjects you mentor" value={subjects.length} /></Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <CardTitle>Subjects you mentor</CardTitle>
            <div className="space-y-2">
              {subjects.map((id) => (
                <p key={id} className="rounded-control border border-brand-300 bg-brand-50/50 px-3 py-2 text-sm font-semibold text-brand-700">{subjectName(id)}</p>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <CardTitle>Your weekly availability</CardTitle>
            <ul className="space-y-2">
              {((slots ?? []) as Slot[]).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-2 rounded-control bg-paper px-3 py-2 text-sm">
                  <span className="font-medium">{DAYS[s.day]}</span> <span className="text-muted">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                </li>
              ))}
            </ul>
          </Card>
          {nextCard}
        </div>
      </>
    );
  }

  const [{ count: waiting }, partners] = await Promise.all([
    supabase.from("partnership_requests").select("id", { count: "exact", head: true }).eq("mentee_id", profile.id).eq("status", "pending"),
    myGroups(supabase, profile.id, "mentee"),
  ]);
  const activeCount = partners.filter((g) => g.members.some((m) => m.mentee_id === profile.id && m.status === "active")).length;
  const invites = partners.filter((g) => g.members.some((m) => m.mentee_id === profile.id && m.status === "invited")).length;
  const actions = [
    {
      href: verified ? "/find" : "/status",
      title: "Find a mentor",
      body: verified ? `Verified mentors for ${subjects.map(subjectName).join(", ") || "your subjects"} who are free when you are.` : "Unlocks once an administrator verifies your account.",
    },
    {
      href: "/partners",
      title: "My study partners",
      body: invites ? `${invites} group ${invites === 1 ? "invite" : "invites"} waiting for your answer.` : activeCount ? `${activeCount} active ${activeCount === 1 ? "partnership" : "partnerships"}.` : "No partners yet. They appear here when a mentor accepts you.",
    },
    {
      href: "/requests",
      title: "Partnership requests",
      body: waiting ? `${waiting} waiting for a mentor to answer.` : "Nothing waiting right now.",
    },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${first}`} description={[profile.year_level, profile.program].filter(Boolean).join(", ")} />
      {!verified ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-control border border-pad-200 bg-pad-50 px-4 py-3 text-sm text-pad-800">
          <span><span className="font-semibold">Verification in progress.</span> An administrator is checking your COE and Student ID. You can search for mentors once you&rsquo;re verified.</span>
          <Link href="/status" className="hit text-xs font-semibold text-pad-800 hover:underline">View status</Link>
        </div>
      ) : null}
      <Card className="divide-y divide-line">
        {actions.map((t) => (
          <Link key={t.title} href={t.href} className="group flex items-center gap-4 px-5 py-4 transition-colors duration-100 hover:bg-paper">
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-brand-800">{t.title}</span>
              <span className="mt-0.5 block text-sm text-muted">{t.body}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
          </Link>
        ))}
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {nextCard}
        <Card className="p-5">
          <CardTitle action={<Link href="/profile" className="hit text-xs font-semibold text-brand-700 hover:underline">Edit</Link>}>Subjects you need help with</CardTitle>
          <div className="space-y-2">
            {subjects.length ? subjects.map((id) => (
              <p key={id} className="rounded-control border border-brand-300 bg-brand-50/50 px-3 py-2 text-xs font-semibold text-brand-700">{subjectName(id)}</p>
            )) : <p className="text-sm text-muted">Add subjects in your profile.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
