import Link from "next/link";
import { requireMe } from "@/lib/auth";
import { profilesById, sessionsFor } from "@/lib/queries";
import { Button, Empty, PageHeader } from "@/components/ui";
import { SessionCard } from "@/components/session-card";
import { sessionStatus } from "@/lib/utils";

export const metadata = { title: "Upcoming Sessions" };

export default async function SessionsPage() {
  const { supabase, profile } = await requireMe();
  const sessions = await sessionsFor(supabase);
  const ids = Array.from(new Set(sessions.map((s) => s.group_id)));
  const { data: groups } = ids.length ? await supabase.from("mentoring_groups").select("id,name").in("id", ids) : { data: [] };
  const gname = Object.fromEntries((groups ?? []).map((g) => [g.id, g.name]));
  const people = await profilesById(supabase, sessions.flatMap((s) => [s.mentor_id, ...s.participants.map((p) => p.mentee_id)]));

  const now = Date.now();
  const needsMe = sessions.filter((s) => {
    if (s.status !== "pending") return false;
    if (s.mentor_id === profile.id) return !s.mentor_confirmed || (s.format === "group" && s.participants.every((p) => p.response !== "pending"));
    return s.participants.find((p) => p.mentee_id === profile.id)?.response === "pending";
  });
  const pending = sessions.filter((s) => s.status === "pending" && !needsMe.includes(s) && new Date(s.starts_at).getTime() > now);
  const upcoming = sessions.filter((s) => sessionStatus(s) === "scheduled");
  const past = sessions.filter((s) => ["completed", "cancelled"].includes(sessionStatus(s)) || (s.status === "pending" && new Date(s.starts_at).getTime() <= now)).reverse();

  const Section = ({ title, list }: { title: string; list: typeof sessions }) =>
    list.length ? (
      <section className="mb-8">
        <p className="eyebrow mb-3">{title} ({list.length})</p>
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((s) => <SessionCard key={s.id} s={s} people={people} me={profile} groupName={gname[s.group_id]} />)}
        </div>
      </section>
    ) : null;

  return (
    <>
      <PageHeader
        title="Upcoming Sessions"
        description="Sessions are confirmed by both sides, then appear on your calendar with the Teams link."
        action={<Button asChild variant="primary" size="sm"><Link href="/sessions/new">Schedule session</Link></Button>}
      />
      {sessions.length ? (
        <>
          <Section title="Needs your response" list={needsMe} />
          <Section title="Scheduled" list={upcoming} />
          <Section title="Waiting for others" list={pending} />
          <Section title="Past & cancelled" list={past} />
        </>
      ) : (
        <Empty title="No sessions yet" action={<Button asChild variant="primary"><Link href="/sessions/new">Schedule session</Link></Button>}>
          Propose a time inside your shared availability. It shows up here once the other side confirms.
        </Empty>
      )}
    </>
  );
}
