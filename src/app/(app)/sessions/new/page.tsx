import Link from "next/link";
import { requireVerified } from "@/lib/auth";
import { myGroups, profilesById, slotsFor } from "@/lib/queries";
import { Button, Empty, PageHeader } from "@/components/ui";
import { ScheduleForm, type Opt } from "./schedule-form";

export const metadata = { title: "Schedule Session" };

export default async function NewSession({ searchParams }: { searchParams: { group?: string } }) {
  const { supabase, profile } = await requireVerified("mentee", "mentor");
  const isMentor = profile.role === "mentor";
  const groups = (await myGroups(supabase, profile.id, profile.role)).filter((g) => {
    const active = g.members.filter((m) => m.status === "active");
    if (!active.length) return false;
    if (isMentor) return true;
    return g.kind === "individual" && active.some((m) => m.mentee_id === profile.id);
  });
  const ids = Array.from(new Set(groups.flatMap((g) => [g.mentor_id, ...g.members.filter((m) => m.status === "active").map((m) => m.mentee_id)])));
  const [people, slots] = await Promise.all([profilesById(supabase, ids), slotsFor(supabase, ids)]);

  const opts: Opt[] = groups.map((g) => {
    const active = g.members.filter((m) => m.status === "active").map((m) => m.mentee_id);
    return {
      id: g.id,
      label: isMentor ? `${g.name}${g.kind === "group" ? ` (${active.length} mentees)` : ""}` : `${people[g.mentor_id]?.full_name} · ${g.name.split(":")[0]}`,
      kind: g.kind,
      subject: g.subject_id,
      mentor: people[g.mentor_id]?.full_name ?? "Mentor",
      mentees: active.map((id) => people[id]?.full_name ?? "Mentee"),
      slots: [g.mentor_id, ...active].map((id) => (slots[id] ?? []).map((s) => ({ day: s.day, start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5) }))),
    };
  });

  return (
    <>
      <PageHeader title="Schedule Session" description={isMentor ? "Propose a session. Mentees confirm attendance before it's scheduled." : "Propose a session. Your mentor confirms it and adds the Microsoft Teams link."} />
      {opts.length ? (
        <ScheduleForm options={opts} initial={searchParams.group} isMentor={isMentor} />
      ) : (
        <Empty title="No partnerships to schedule with" action={<Button asChild variant="teal"><Link href={isMentor ? "/requests" : "/find"}>{isMentor ? "View requests" : "Find a mentor"}</Link></Button>}>
          {isMentor ? "Accept a partnership request first." : "Sessions can be scheduled once a mentor accepts your request. Group sessions are scheduled by the mentor."}
        </Empty>
      )}
    </>
  );
}
