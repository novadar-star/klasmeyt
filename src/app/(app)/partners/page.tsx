import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { myGroups, profilesById, slotsFor } from "@/lib/queries";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { Badge, StatusBadge, VerifiedMentorBadge } from "@/components/badges";
import { daysText, timeText } from "@/components/avail";
import { subjectName } from "@/lib/utils";
import { InviteResponse } from "./invite-response";

export const metadata = { title: "My study partners" };

export default async function PartnersPage() {
  const { supabase, profile } = await requireRole("mentee");
  const groups = await myGroups(supabase, profile.id, "mentee");
  const mine = (g: (typeof groups)[number]) => g.members.find((m) => m.mentee_id === profile.id);
  const active = groups.filter((g) => mine(g)?.status === "active");
  const invites = groups.filter((g) => mine(g)?.status === "invited");
  const mentorIds = groups.map((g) => g.mentor_id);
  const [people, slots] = await Promise.all([profilesById(supabase, mentorIds), slotsFor(supabase, mentorIds)]);

  return (
    <>
      <PageHeader title="My study partners" description="Mentors who accepted you, one-on-one or in a study group." />

      {invites.length ? (
        <div className="mb-6 space-y-3">
          <p className="eyebrow">Group invitations</p>
          {invites.map((g) => (
            <Card key={g.id} className="flex flex-col gap-3 border-slate-200 p-5 sm:flex-row sm:items-center">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-brand-800">{g.name}</p>
                  <StatusBadge status="invited" />
                </div>
                <p className="text-xs text-muted">{people[g.mentor_id]?.full_name} invited you to a {subjectName(g.subject_id)} group with {g.members.filter((m) => m.status === "active").length} {g.members.filter((m) => m.status === "active").length === 1 ? "member" : "members"}.</p>
              </div>
              <InviteResponse groupId={g.id} groupName={g.name} mentorName={people[g.mentor_id]?.full_name ?? "Your mentor"} members={g.members.filter((m) => m.status === "active").length} />
            </Card>
          ))}
        </div>
      ) : null}

      <p className="eyebrow mb-3">{active.length} active {active.length === 1 ? "partnership" : "partnerships"}</p>
      {active.length ? (
        <div className="space-y-3">
          {active.map((g) => {
            const m = people[g.mentor_id];
            return (
              <Card key={g.id} className="flex flex-col gap-4 p-5 md:flex-row md:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-lg font-semibold text-brand-800">{m?.full_name}</p>
                      <p className="text-xs text-muted">{m?.program}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <VerifiedMentorBadge />
                      {g.kind === "group" ? <Badge color="ink">Study group, {g.members.filter((x) => x.status === "active").length} mentees</Badge> : null}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div><p className="eyebrow">Subject</p><p className="mt-1 text-sm font-semibold text-brand-700">{subjectName(g.subject_id)}</p></div>
                    <div><p className="eyebrow">Mentor is free on</p><p className="mt-1 text-sm">{daysText(slots[g.mentor_id])}</p></div>
                    <div><p className="eyebrow">Hours</p><p className="mt-1 text-sm">{timeText(slots[g.mentor_id])}</p></div>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 md:w-44 md:flex-col">
                  <Button asChild variant="primary"><Link href={`/chat/${g.id}`}>Open chat</Link></Button>
                  {g.kind === "individual" ? <Button asChild variant="secondary"><Link href={`/sessions/new?group=${g.id}`}>Schedule session</Link></Button> : null}
                  <Button asChild variant="secondary"><Link href={`/mentors/${g.mentor_id}`}>View profile</Link></Button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No study partner yet" action={<Button asChild variant="primary"><Link href="/find">Find a mentor</Link></Button>}>
          When a mentor accepts your request, they'll appear here with your chatbox and scheduling.
        </Empty>
      )}
    </>
  );
}
