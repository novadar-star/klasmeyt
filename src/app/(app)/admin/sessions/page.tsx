import { requireRole } from "@/lib/auth";
import { profilesById, sessionsFor } from "@/lib/queries";
import { Card, Empty, PageHeader } from "@/components/ui";
import { SessionBadge } from "@/components/badges";
import { fmtDateTime, sessionStatus, subjectName } from "@/lib/utils";

export const metadata = { title: "Sessions" };

export default async function AdminSessions() {
  const { supabase } = await requireRole("admin");
  const sessions = (await sessionsFor(supabase)).reverse();
  const people = await profilesById(supabase, sessions.flatMap((s) => [s.mentor_id, ...s.participants.map((p) => p.mentee_id)]));
  return (
    <>
      <PageHeader title="Sessions" description="Every proposed and scheduled session, with its Microsoft Teams link." />
      {sessions.length ? (
        <Card className="overflow-x-auto" tabIndex={0} role="region" aria-label="Sessions table, scrolls sideways on small screens">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs font-medium text-muted">
              <tr><th className="px-4 py-3">When</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Mentor</th><th className="px-4 py-3">Mentees</th><th className="px-4 py-3">Meeting link</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sessions.map((s) => (
                <tr key={s.id}>
                  <td className="px-4 py-3 text-xs">{fmtDateTime(s.starts_at, { weekday: "short" })}<br /><span className="text-muted">{s.duration_min} min · {s.format === "group" ? "Group" : "One-on-one"}</span></td>
                  <td className="px-4 py-3 font-medium text-brand-700">{subjectName(s.subject_id)}</td>
                  <td className="px-4 py-3">{people[s.mentor_id]?.full_name}</td>
                  <td className="px-4 py-3 text-xs">{s.participants.map((p) => `${people[p.mentee_id]?.full_name ?? ""}${s.status === "pending" ? ` (${p.response})` : ""}`).join(", ")}</td>
                  <td className="max-w-[12rem] truncate px-4 py-3 text-xs">{s.teams_link ? <a className="inline-block py-1.5 text-brand-700 hover:underline" href={s.teams_link} target="_blank" rel="noreferrer">{s.teams_link}</a> : <span className="text-muted">—</span>}</td>
                  <td className="px-4 py-3"><SessionBadge status={sessionStatus(s)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Empty title="No sessions yet" />
      )}
    </>
  );
}
