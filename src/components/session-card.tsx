import { CalendarClock, Clock, Users, Video } from "lucide-react";
import { SessionBadge, StatusBadge } from "@/components/badges";
import { cn, fmtDateTime, sessionStatus, subjectName } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import { notAttending, type SessionFull } from "@/lib/queries";
import { SessionActions } from "@/components/session-actions";

const RSVP: Record<string, [string, string]> = {
  confirmed: ["Confirmed", "text-brand-700"],
  declined: ["Cannot attend", "text-red-700"],
  pending: ["No response yet", "text-pad-800"],
};

export function SessionCard({ s, people, me, groupName, compact }: { s: SessionFull; people: Record<string, Profile>; me?: Profile; groupName?: string; compact?: boolean }) {
  const status = sessionStatus(s);
  const out = me ? notAttending(s, me.id) && ["pending", "scheduled"].includes(status) : false;
  const mentees = s.participants.map((p) => ({ ...p, name: people[p.mentee_id]?.full_name ?? "Mentee" }));
  const showRsvp = s.format === "group" && ["pending", "scheduled", "completed"].includes(status);
  const canJoin = status === "scheduled" && s.teams_link && !out;
  return (
    <div className="rounded-panel border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium">{subjectName(s.subject_id)} {s.format === "group" ? "group session" : "session"}</p>
          {groupName ? <p className="truncate text-xs text-muted">{groupName}</p> : null}
        </div>
        {out ? <StatusBadge status="not_attending" /> : <SessionBadge status={status} />}
      </div>
      <dl className="mt-3 grid gap-1.5 text-sm text-ink sm:grid-cols-2">
        <div className="flex items-center gap-2"><CalendarClock className="size-4 shrink-0 text-brand-500" aria-hidden /> {fmtDateTime(s.starts_at, { weekday: "short" })}</div>
        <div className="flex items-center gap-2"><Clock className="size-4 shrink-0 text-brand-500" aria-hidden /> {s.duration_min} minutes</div>
        <div className="flex items-start gap-2 sm:col-span-2">
          <Users className="mt-0.5 size-4 shrink-0 text-brand-500" aria-hidden />
          <span className="min-w-0">
            Mentor {people[s.mentor_id]?.full_name ?? ""}
            {!showRsvp && mentees.length ? ` · ${mentees.map((m) => m.name).join(", ")}` : ""}
          </span>
        </div>
      </dl>

      {/* Who's coming: every invited mentee and their answer (group sessions) */}
      {showRsvp ? (
        <ul className="mt-3 divide-y divide-line rounded-control border border-line text-sm" aria-label="Attendance">
          {mentees.map((m) => {
            const [label, tone] = RSVP[m.response] ?? RSVP.pending;
            return (
              <li key={m.mentee_id} className="flex items-center justify-between gap-3 px-3 py-2">
                <span className="min-w-0 truncate">{m.name}{me?.id === m.mentee_id ? " (you)" : ""}</span>
                <span className={cn("shrink-0 text-xs font-semibold", tone)}>{label}</span>
              </li>
            );
          })}
        </ul>
      ) : null}

      {s.notes && !compact ? <p className="mt-2 break-words text-sm text-muted">{s.notes}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canJoin ? (
          <a href={s.teams_link!} target="_blank" rel="noreferrer" className="press inline-flex h-9 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700">
            <Video className="size-4" aria-hidden /> Join meeting
          </a>
        ) : null}
        {me ? <SessionActions s={s} me={me.id} isMentor={s.mentor_id === me.id} status={status} /> : null}
      </div>
    </div>
  );
}
