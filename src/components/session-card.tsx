import { CalendarClock, Clock, Users, Video } from "lucide-react";
import { StatusBadge } from "@/components/badges";
import { fmtDateTime, sessionStatus, subjectName } from "@/lib/utils";
import type { Profile } from "@/lib/types";
import type { SessionFull } from "@/lib/queries";
import { SessionActions } from "@/components/session-actions";

export function SessionCard({ s, people, me, groupName, compact }: { s: SessionFull; people: Record<string, Profile>; me?: Profile; groupName?: string; compact?: boolean }) {
  const status = sessionStatus(s);
  const mentees = s.participants.map((p) => ({ ...p, name: people[p.mentee_id]?.full_name ?? "Mentee" }));
  const canJoin = status === "scheduled" && s.teams_link;
  return (
    <div className="rounded-panel border border-line bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{subjectName(s.subject_id)} {s.format === "group" ? "group session" : "session"}</p>
          {groupName ? <p className="text-xs text-muted">{groupName}</p> : null}
        </div>
        <StatusBadge status={status} />
      </div>
      <dl className="mt-3 grid gap-1.5 text-sm text-ink sm:grid-cols-2">
        <div className="flex items-center gap-2"><CalendarClock className="size-4 text-brand-500" /> {fmtDateTime(s.starts_at, { weekday: "short" })}</div>
        <div className="flex items-center gap-2"><Clock className="size-4 text-brand-500" /> {s.duration_min} minutes</div>
        <div className="flex items-center gap-2 sm:col-span-2"><Users className="size-4 shrink-0 text-brand-500" />
          <span>Mentor {people[s.mentor_id]?.full_name ?? ""}{mentees.length ? " · " : ""}
            {mentees.map((m, i) => (
              <span key={m.mentee_id}>
                {i ? ", " : ""}{m.name}
                {s.status === "pending" && s.format === "group" ? <span className="text-muted"> ({m.response})</span> : null}
              </span>
            ))}
          </span>
        </div>
      </dl>
      {s.notes && !compact ? <p className="mt-2 text-sm text-muted">{s.notes}</p> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canJoin ? (
          <a href={s.teams_link!} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-control bg-brand-600 px-4 text-sm font-semibold text-white transition-[transform,background-color] duration-150 ease-out hover:bg-brand-700 active:scale-[0.97]">
            <Video className="size-4" /> Join meeting
          </a>
        ) : null}
        {me ? <SessionActions s={s} me={me.id} isMentor={s.mentor_id === me.id} status={status} /> : null}
      </div>
    </div>
  );
}
