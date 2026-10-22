import Link from "next/link";
import { requireVerified } from "@/lib/auth";
import { agreedWindows, myGroups, profilesById } from "@/lib/queries";
import { Button, Empty, PageHeader } from "@/components/ui";
import { ScheduleForm, type Opt } from "./schedule-form";

export const metadata = { title: "Schedule Session" };

export default async function NewSession({ searchParams }: { searchParams: { group?: string; replace?: string } }) {
  const { supabase, profile } = await requireVerified("mentee", "mentor");
  const isMentor = profile.role === "mentor";
  const groups = (await myGroups(supabase, profile.id, profile.role)).filter((g) => {
    const active = g.members.filter((m) => m.status === "active");
    if (!active.length) return false;
    if (isMentor) return true;
    return g.kind === "individual" && active.some((m) => m.mentee_id === profile.id);
  });
  const ids = Array.from(new Set(groups.flatMap((g) => [g.mentor_id, ...g.members.filter((m) => m.status === "active").map((m) => m.mentee_id)])));
  const [people, agreed] = await Promise.all([profilesById(supabase, ids), agreedWindows(supabase, groups)]);

  // "Propose another time": the pending session this proposal replaces (must be mine and still pending)
  let replaces: { id: string; group: string; starts_at: string } | null = null;
  if (searchParams.replace) {
    const { data } = await supabase.from("sessions").select("id,group_id,starts_at,status,proposed_by").eq("id", searchParams.replace).maybeSingle();
    if (data && data.status === "pending" && data.proposed_by === profile.id) replaces = { id: data.id, group: data.group_id, starts_at: data.starts_at };
  }

  const opts: Opt[] = groups.map((g) => {
    const active = g.members.filter((m) => m.status === "active").map((m) => m.mentee_id);
    return {
      id: g.id,
      label: isMentor ? `${g.name}${g.kind === "group" ? ` (${active.length} mentees)` : ""}` : `${people[g.mentor_id]?.full_name} · ${g.name.split(":")[0]}`,
      kind: g.kind,
      subject: g.subject_id,
      mentor: people[g.mentor_id]?.full_name ?? "Mentor",
      mentees: active.map((id) => people[id]?.full_name ?? "Mentee"),
      // one list per mentee: the hours agreed with the mentor when that partnership was accepted
      slots: active.map((id) => agreed[g.id]?.[id] ?? []),
    };
  });

  return (
    <>
      <PageHeader
        title={replaces ? "Propose another time" : "Schedule a session"}
        description={
          isMentor
            ? "Pick a time inside the schedule agreed when each partnership was accepted. Mentees confirm attendance before it's scheduled."
            : "Pick a time inside the schedule agreed with your mentor. Your mentor confirms it and adds the Microsoft Teams link."
        }
      />
      {opts.length ? (
        <ScheduleForm options={opts} initial={replaces?.group ?? searchParams.group} isMentor={isMentor} replaces={replaces} />
      ) : (
        <Empty title="No partnerships to schedule with" action={<Button asChild variant="primary"><Link href={isMentor ? "/requests" : "/find"}>{isMentor ? "View requests" : "Find a mentor"}</Link></Button>}>
          {isMentor ? "Accept a partnership request first." : "Sessions can be scheduled once a mentor accepts your request. Group sessions are scheduled by the mentor."}
        </Empty>
      )}
    </>
  );
}
