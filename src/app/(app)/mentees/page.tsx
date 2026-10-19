import Link from "next/link";
import { requireVerified } from "@/lib/auth";
import { myGroups, profilesById, slotsFor } from "@/lib/queries";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { Badge, StatusBadge } from "@/components/badges";
import { daysText, timeText } from "@/components/avail";
import { subjectName } from "@/lib/utils";
import { AddToGroup, RenameGroup } from "./group-tools";

export const metadata = { title: "My Mentees" };

export default async function MenteesPage() {
  const { supabase, profile } = await requireVerified("mentor");
  const groups = await myGroups(supabase, profile.id, "mentor");
  const menteeIds = groups.flatMap((g) => g.members.map((m) => m.mentee_id));
  const [people, slots] = await Promise.all([profilesById(supabase, menteeIds), slotsFor(supabase, menteeIds)]);
  const individuals = groups.filter((g) => g.kind === "individual" && g.members.some((m) => m.status === "active"));
  const teams = groups.filter((g) => g.kind === "group");

  // accepted mentees per subject (for "add to group")
  const { data: accepted } = await supabase.from("partnership_requests").select("mentee_id,subject_id").eq("mentor_id", profile.id).eq("status", "accepted");

  return (
    <>
      <PageHeader title="My Mentees" description="Monitor accepted peer partnerships and schedule review blocks." />

      <p className="eyebrow mb-3">One-on-one partnerships</p>
      {individuals.length ? (
        <div className="space-y-3">
          {individuals.map((g) => {
            const m = g.members.find((x) => x.status === "active")!;
            const p = people[m.mentee_id];
            return (
              <Card key={g.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-brand-700">{p?.full_name}</p>
                    <p className="text-xs text-muted">{[p?.year_level, p?.program].filter(Boolean).join(" • ")}</p>
                  </div>
                  <Badge color="teal">Partnership accepted</Badge>
                </div>
                <div className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-2">
                  <div><p className="eyebrow">Engagement subject</p><p className="mt-1 text-sm font-semibold text-brand-700">{subjectName(g.subject_id)}</p></div>
                  <div><p className="eyebrow">Sync availability</p><p className="mt-1 text-sm">{daysText(slots[m.mentee_id])} ({timeText(slots[m.mentee_id])})</p></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="outline"><Link href={`/mentees/${m.mentee_id}`}>View profile</Link></Button>
                  <Button asChild variant="teal"><Link href={`/sessions/new?group=${g.id}`}>Schedule session</Link></Button>
                  <Button asChild variant="ghost"><Link href={`/chat/${g.id}`}>Open chat</Link></Button>
                  <AddToGroup menteeId={m.mentee_id} menteeName={p?.full_name ?? "Mentee"} groups={teams.filter((t) => t.subject_id === g.subject_id && !t.members.some((x) => x.mentee_id === m.mentee_id && x.status !== "left")).map((t) => ({ id: t.id, name: t.name }))} />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No one-on-one mentees yet">Accept a partnership request to start a private chatbox.</Empty>
      )}

      <p className="eyebrow mb-3 mt-8">Mentoring groups</p>
      {teams.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {teams.map((g) => {
            const eligible = (accepted ?? []).filter((a) => a.subject_id === g.subject_id && !g.members.some((x) => x.mentee_id === a.mentee_id && x.status !== "left"));
            return (
              <Card key={g.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-brand-700">{g.name}</p>
                    <span className="chip mt-1">{subjectName(g.subject_id)}</span>
                  </div>
                  <RenameGroup id={g.id} name={g.name} />
                </div>
                <ul className="mt-4 space-y-1.5">
                  {g.members.filter((m) => m.status !== "left").map((m) => (
                    <li key={m.mentee_id} className="flex items-center justify-between gap-2 text-sm">
                      <Link href={`/mentees/${m.mentee_id}`} className="hover:underline">{people[m.mentee_id]?.full_name}</Link>
                      <StatusBadge status={m.status} />
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="teal" size="sm"><Link href={`/sessions/new?group=${g.id}`}>Schedule group session</Link></Button>
                  <Button asChild variant="outline" size="sm"><Link href={`/chat/${g.id}`}>Open group chat</Link></Button>
                  {eligible.length ? (
                    <AddToGroup groupId={g.id} groupName={g.name} candidates={Array.from(new Set(eligible.map((e) => e.mentee_id))).map((id) => ({ id, name: people[id]?.full_name ?? "Mentee" }))} />
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No groups yet">When accepting a request, choose “Start a new group” to create one. Then invite other compatible mentees from here.</Empty>
      )}
    </>
  );
}
