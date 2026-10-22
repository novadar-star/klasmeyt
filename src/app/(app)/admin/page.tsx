import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { subjectsFor } from "@/lib/queries";
import { Button, Card, CardTitle, Empty, PageHeader, Stat } from "@/components/ui";
import { VerificationBadge } from "@/components/badges";
import { subjectName, relTime } from "@/lib/utils";
import { OPEN_STATUSES, applicants } from "@/lib/admin";

export const metadata = { title: "Applications Queue" };

const OPEN = OPEN_STATUSES;

export default async function AdminHome() {
  const { supabase } = await requireRole("admin");
  const [{ data: stats }, mentors, mentees] = await Promise.all([supabase.rpc("admin_overview"), applicants(supabase, "mentor"), applicants(supabase, "mentee")]);
  const s = (stats ?? {}) as Record<string, number>;
  const subs = await subjectsFor(supabase, mentors.map((m) => m.user_id));
  const queue = [...mentors.filter((m) => OPEN.includes(m.status)), ...mentors.filter((m) => !OPEN.includes(m.status))].slice(0, 12);
  const menteeQueue = mentees.filter((m) => OPEN.includes(m.status)).slice(0, 6);

  return (
    <>
      <PageHeader title="Applications queue" description="Review mentor applications and mentee documents. Students are notified of every decision." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total applications" value={s.mentor_applicants ?? 0} />
        <Stat label="Pending review" value={s.pending_applications ?? 0} />
        <Stat label="Approved mentors" value={s.verified_mentors ?? 0} />
        <Stat label="Rejected applications" value={mentors.filter((m) => m.status === "rejected").length} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Registered mentees" value={s.mentees ?? 0} />
        <Stat label="Active partnerships" value={s.active_partnerships ?? 0} />
        <Stat label="Mentoring groups" value={s.groups ?? 0} />
        <Stat label="Upcoming sessions" value={s.upcoming_sessions ?? 0} />
      </div>

      <Card className="mt-6 p-5">
        <CardTitle action={<Link href="/admin/mentors?status=all" className="text-xs font-semibold text-brand-700 hover:underline">View all mentors</Link>}>Mentor applications, newest needing review first</CardTitle>
        {queue.length ? (
          <div className="space-y-2">
            {queue.map((r) => (
              <div key={r.user_id} className="grid items-center gap-3 rounded-control border border-line px-4 py-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_10.5rem_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{r.profile.full_name}</p>
                  <p className="truncate text-xs text-muted">{[r.profile.year_level, r.profile.program].filter(Boolean).join(" • ") || "Profile incomplete"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted">Supported courses</p>
                  <p className="truncate text-sm font-semibold text-brand-700">{(subs[r.user_id] ?? []).map(subjectName).join(", ") || <span className="font-normal text-muted">None yet</span>}</p>
                </div>
                <div className="sm:justify-self-end"><VerificationBadge status={r.status} kind="mentor" /></div>
                <Button asChild size="sm" variant={r.status === "verified" ? "secondary" : "primary"}><Link href={`/admin/users/${r.user_id}`}>{r.status === "verified" ? "View" : "Review application"}</Link></Button>
              </div>
            ))}
          </div>
        ) : (
          <Empty title="No mentor applications yet" />
        )}
      </Card>

      <Card className="mt-6 p-5">
        <CardTitle action={<Link href="/admin/mentees" className="text-xs font-semibold text-brand-700 hover:underline">View all</Link>}>Mentees waiting for verification</CardTitle>
        {menteeQueue.length ? (
          <div className="space-y-2">
            {menteeQueue.map((r) => (
              <div key={r.user_id} className="grid items-center gap-3 rounded-control border border-line px-4 py-3 sm:grid-cols-[minmax(0,1fr)_10.5rem_auto]">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{r.profile.full_name}</p>
                  <p className="truncate text-xs text-muted">{[r.profile.year_level, r.profile.program].filter(Boolean).join(" • ")} · {relTime(r.updated_at)}</p>
                </div>
                <div className="sm:justify-self-end"><VerificationBadge status={r.status} /></div>
                <Button asChild size="sm" variant="secondary"><Link href={`/admin/users/${r.user_id}`}>Review documents</Link></Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted">No mentees waiting for verification.</p>
        )}
      </Card>
    </>
  );
}
