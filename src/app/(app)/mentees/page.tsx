import Link from "next/link";
import { requireVerified } from "@/lib/auth";
import { myGroups, profilesById, slotsFor } from "@/lib/queries";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { daysText, timeText } from "@/components/avail";
import { subjectName } from "@/lib/utils";
import { AddToGroup, RenameGroup } from "./group-tools";

export const metadata = { title: "My mentees" };

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
      <PageHeader title="My mentees" description="Everyone you've accepted, one-on-one and in study groups." />

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
                    <p className="text-lg font-semibold text-brand-800">{p?.full_name}</p>
                    <p className="text-xs text-muted">{[p?.year_level, p?.program].filter(Boolean).join(" • ")}</p>
                  </div>
                  <span className="chip">{subjectName(g.subject_id)}</span>
                </div>
                <div className="mt-4 border-t border-line pt-4">
                  <p className="eyebrow">Free on</p>
                  <p className="mt-1 text-sm">{daysText(slots[m.mentee_id])}, {timeText(slots[m.mentee_id])}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="primary"><Link href={`/sessions/new?group=${g.id}`}>Schedule session</Link></Button>
                  <Button asChild variant="secondary"><Link href={`/chat/${g.id}`}>Open chat</Link></Button>
                  <Button asChild variant="quiet"><Link href={`/mentees/${m.mentee_id}`}>View profile</Link></Button>
                  <AddToGroup menteeId={m.mentee_id} menteeName={p?.full_name ?? "Mentee"} groups={teams.filter((t) => t.subject_id === g.subject_id && !t.members.some((x) => x.mentee_id === m.mentee_id && x.status !== "left")).map((t) => ({ id: t.id, name: t.name }))} />
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No one-on-one mentees yet">Accept a partnership request to start a private chatbox.</Empty>
      )}

      <p className="eyebrow mb-3 mt-8">Study groups</p>
      {teams.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {teams.map((g) => {
            const eligible = (accepted ?? []).filter((a) => a.subject_id === g.subject_id && !g.members.some((x) => x.mentee_id === a.mentee_id && x.status !== "left"));
            return (
              <Card key={g.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-800">{g.name}</p>
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
                  <Button asChild variant="primary" size="sm"><Link href={`/sessions/new?group=${g.id}`}>Schedule group session</Link></Button>
                  <Button asChild variant="secondary" size="sm"><Link href={`/chat/${g.id}`}>Open group chat</Link></Button>
                  {eligible.length ? (
                    <AddToGroup groupId={g.id} groupName={g.name} candidates={Array.from(new Set(eligible.map((e) => e.mentee_id))).map((id) => ({ id, name: people[id]?.full_name ?? "Mentee" }))} />
                  ) : null}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No study groups yet">When you accept a request, choose &ldquo;Start a new group&rdquo; to create one. Then invite other mentees for the same subject from here.</Empty>
      )}
    </>
  );
}
