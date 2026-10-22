import Link from "next/link";
import { CalendarDays, MonitorSmartphone } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { profilesById, slotsFor } from "@/lib/queries";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { daysText, timeText } from "@/components/avail";
import { fmtDateTime, relTime, subjectName } from "@/lib/utils";
import { CancelRequest, RespondRequest } from "./actions";

export const metadata = { title: "Partnership requests" };

type Req = { id: string; mentee_id: string; mentor_id: string; subject_id: number; message: string | null; status: string; group_id: string | null; created_at: string; responded_at: string | null };

export default async function RequestsPage() {
  const { supabase, profile } = await requireMe();
  const isMentor = profile.role === "mentor";
  const { data } = await supabase
    .from("partnership_requests")
    .select("*")
    .eq(isMentor ? "mentor_id" : "mentee_id", profile.id)
    .order("created_at", { ascending: false });
  const reqs = (data ?? []) as Req[];
  const others = reqs.map((r) => (isMentor ? r.mentee_id : r.mentor_id));
  const [people, slots] = await Promise.all([profilesById(supabase, others), slotsFor(supabase, others)]);
  const pending = reqs.filter((r) => r.status === "pending");
  const past = reqs.filter((r) => r.status !== "pending");

  let groups: { id: string; name: string; subject_id: number; kind: string }[] = [];
  if (isMentor) {
    const { data: g } = await supabase.from("mentoring_groups").select("id,name,subject_id,kind").eq("mentor_id", profile.id).eq("kind", "group");
    groups = g ?? [];
  }

  if (!isMentor) {
    return (
      <>
        <PageHeader title="Partnership requests" description="Requests you've sent to mentors, and their answers." action={<Button asChild variant="primary" size="sm"><Link href="/find">Find a mentor</Link></Button>} />
        {reqs.length ? (
          <div className="space-y-3">
            {reqs.map((r) => {
              const m = people[r.mentor_id];
              return (
                <Card key={r.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-brand-800">{m?.full_name ?? "Mentor"}</p>
                      <StatusBadge status={r.status} label={r.status === "accepted" ? "Accepted" : undefined} />
                    </div>
                    <p className="text-xs text-muted">{subjectName(r.subject_id)}, sent {relTime(r.created_at)}</p>
                    {r.message ? <p className="mt-2 line-clamp-2 text-sm text-ink">&ldquo;{r.message}&rdquo;</p> : null}
                  </div>
                  <div className="flex gap-2">
                    {r.status === "pending" ? <CancelRequest id={r.id} /> : null}
                    {r.status === "accepted" && r.group_id ? <Button asChild variant="primary" size="sm"><Link href={`/chat/${r.group_id}`}>Open chat</Link></Button> : null}
                    {r.status === "accepted" ? <Button asChild variant="secondary" size="sm"><Link href="/partners">My partner</Link></Button> : null}
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Empty title="No requests yet" action={<Button asChild variant="primary"><Link href="/find">Find a mentor</Link></Button>}>
            Find a verified mentor and send a request for the subject you need help with.
          </Empty>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader title="Partnership requests" description="Mentees asking you to mentor them. Accept one-on-one, add to a study group, or decline." />
      {pending.length ? (
        <div className="space-y-4">
          {pending.map((r) => {
            const p = people[r.mentee_id];
            return (
              <Card key={r.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <Link href={`/mentees/${r.mentee_id}`} className="text-lg font-semibold text-brand-800 hover:underline">{p?.full_name ?? "Mentee"}</Link>
                    <p className="text-xs text-muted">{[p?.year_level, p?.program].filter(Boolean).join(" • ")}</p>
                  </div>
                  <span className="chip">{subjectName(r.subject_id)}</span>
                </div>
                <p className="eyebrow mt-5">Their message</p>
                <p className="mt-1.5 rounded-control bg-paper p-4 text-sm leading-relaxed text-ink">{r.message ? `“${r.message}”` : <span className="text-muted">No message.</span>}</p>
                <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink">
                  <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-muted" /><span className="font-semibold">Free on:</span> {daysText(slots[r.mentee_id])}, {timeText(slots[r.mentee_id])}</span>
                  {p?.modality ? <span className="flex items-center gap-1.5"><MonitorSmartphone className="size-3.5 text-muted" /><span className="font-semibold">Prefers:</span> {p.modality}</span> : null}
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <RespondRequest id={r.id} subjectId={r.subject_id} menteeName={p?.full_name ?? "this mentee"} groups={groups.filter((g) => g.subject_id === r.subject_id)} />
                  <Button asChild variant="quiet" size="md"><Link href={`/mentees/${r.mentee_id}`}>View profile</Link></Button>
                </div>
                <p className="mt-3 text-[11px] text-muted">Received {fmtDateTime(r.created_at)}</p>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No pending requests">New partnership requests from mentees will appear here.</Empty>
      )}

      {past.length ? (
        <>
          <p className="eyebrow mb-3 mt-8">Answered requests</p>
          <Card className="divide-y divide-line">
            {past.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <span className="min-w-0 flex-1 font-semibold text-brand-700">{people[r.mentee_id]?.full_name}</span>
                <span className="text-xs text-muted">{subjectName(r.subject_id)}</span>
                <StatusBadge status={r.status} label={r.status === "accepted" ? "Accepted" : undefined} />
                {r.group_id ? <Link href={`/chat/${r.group_id}`} className="hit text-xs font-semibold text-brand-700 hover:underline">Chat</Link> : null}
              </div>
            ))}
          </Card>
        </>
      ) : null}
    </>
  );
}
