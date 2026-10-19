import Link from "next/link";
import { CalendarDays, FileText, UserSearch, Users } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { myGroups, profilesById, sessionsFor } from "@/lib/queries";
import { Card, CardTitle, PageHeader, Stat } from "@/components/ui";
import { VerifiedMentorBadge } from "@/components/badges";
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
  const upcoming = sessions.filter((s) => ["pending", "scheduled"].includes(sessionStatus(s)) && new Date(s.starts_at) > new Date());
  const next = upcoming.find((s) => s.status === "scheduled") ?? upcoming[0];
  const people = await profilesById(supabase, next ? [next.mentor_id, ...next.participants.map((p) => p.mentee_id)] : []);

  const nextCard = (
    <Card className="p-5">
      <CardTitle>{profile.role === "mentor" ? "Next Scheduled Review" : "Next Peer Review Session"}</CardTitle>
      {next ? (
        <Link href="/sessions" className="block rounded-lg bg-paper p-4 ring-1 ring-inset ring-line hover:ring-teal-300">
          {profile.role === "mentee" ? <VerifiedMentorBadge /> : null}
          <p className="mt-2 font-semibold text-brand-700">{subjectName(next.subject_id)} {next.format === "group" ? "Group Session" : "Review Session"}</p>
          <p className="text-xs text-muted">
            {profile.role === "mentor"
              ? `With ${next.participants.map((p) => people[p.mentee_id]?.full_name.split(" ")[0]).filter(Boolean).join(", ")}`
              : `With ${people[next.mentor_id]?.full_name ?? "your mentor"}`}
            {next.status === "pending" ? " · awaiting confirmation" : ""}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink">
            <CalendarDays className="size-3.5 text-muted" /> {fmtDate(next.starts_at)} · {fmtClock(next.starts_at)} – {fmtClock(new Date(new Date(next.starts_at).getTime() + next.duration_min * 60000).toISOString())}
          </p>
        </Link>
      ) : (
        <p className="text-sm text-muted">No upcoming sessions yet.</p>
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
        <PageHeader title={`Welcome, ${first}`} description={[profile.year_level, profile.program, "Verified Mentor"].filter(Boolean).join(" | ")} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/requests"><Stat label="Pending partnerships" value={`${pending ?? 0} ${pending === 1 ? "Request" : "Requests"}`} /></Link>
          <Link href="/mentees"><Stat label="Active mentees" value={`${mentees.size} ${mentees.size === 1 ? "Mentee" : "Mentees"}`} /></Link>
          <Link href="/subjects"><Stat label="My supported subjects" value={`${subjects.length} ${subjects.length === 1 ? "Course" : "Courses"}`} /></Link>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <CardTitle>My Program Aligned Subjects</CardTitle>
            <div className="space-y-2">
              {subjects.map((id) => (
                <p key={id} className="rounded-md border border-teal-400 bg-teal-50/50 px-3 py-2 text-sm font-semibold text-teal-700">{subjectName(id)}</p>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <CardTitle>Weekly Agenda Sync</CardTitle>
            <ul className="space-y-2">
              {((slots ?? []) as Slot[]).map((s) => (
                <li key={s.id} className="flex items-center gap-2 rounded-md bg-paper px-3 py-2 text-sm">
                  <span className="size-1.5 rounded-full bg-amber-500" /> {DAYS[s.day]} · {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                </li>
              ))}
            </ul>
          </Card>
          {nextCard}
        </div>
      </>
    );
  }

  const tiles = [
    { href: verified ? "/find" : "/status", icon: UserSearch, tint: "bg-teal-50 text-teal-700", title: "Find a Mentor", body: verified ? `Find verified mentors for ${subjects.map(subjectName).join(", ") || "your subjects"}` : "Available once your account is verified" },
    { href: "/partners", icon: Users, tint: "bg-brand-50 text-brand-600", title: "My Study Partner", body: "Connect with your assigned study buddies and peer mentors" },
    { href: "/requests", icon: FileText, tint: "bg-amber-50 text-amber-600", title: "Partnership Requests", body: "Check your pending and answered partnership requests" },
  ];

  return (
    <>
      <PageHeader title={`Welcome, ${first}`} description={[profile.program, "Falcon Mentoring Space"].filter(Boolean).join(" · ")} />
      {!verified ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span><span className="font-semibold">Verification pending.</span> An administrator is checking your COE and Student ID. You can search for mentors once you're verified.</span>
          <Link href="/status" className="text-xs font-bold uppercase tracking-wide text-amber-700 hover:underline">View status</Link>
        </div>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.title} href={t.href} className="rounded-xl border border-line bg-white p-5 transition-colors hover:border-teal-300">
            <span className={`grid size-9 place-items-center rounded-lg ${t.tint}`}><t.icon className="size-4" /></span>
            <p className="mt-4 font-bold text-brand-700">{t.title}</p>
            <p className="mt-1 text-xs text-muted">{t.body}</p>
          </Link>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {nextCard}
        <Card className="p-5">
          <CardTitle>Curriculum-Course Alignment</CardTitle>
          <p className="mb-3 text-xs text-muted">Based on the subjects you're taking</p>
          <div className="space-y-2">
            {subjects.length ? subjects.map((id) => (
              <p key={id} className="rounded-md border border-teal-400 bg-teal-50/50 px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-teal-700">Active matching: {subjectName(id)}</p>
            )) : <p className="text-sm text-muted">Add subjects in your profile.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
