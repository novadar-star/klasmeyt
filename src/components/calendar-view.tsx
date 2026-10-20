import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { DAYS_SHORT, TZ, cn, fmtClock, fmtDateTime, sessionStatus, subjectName } from "@/lib/utils";
import type { SessionFull } from "@/lib/queries";

const DOT: Record<string, string> = {
  pending: "bg-pad-50 text-pad-800 ring-pad-200",
  scheduled: "bg-brand-50 text-brand-700 ring-brand-200",
  completed: "bg-slate-100 text-slate-600 ring-slate-200",
  cancelled: "bg-white text-slate-500 line-through ring-slate-200",
  expired: "bg-white text-slate-500 ring-slate-200",
};
const LEGEND: [string, string][] = [["pending", "Waiting for a response"], ["scheduled", "Scheduled"], ["completed", "Completed"], ["cancelled", "Cancelled"]];

const ymd = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));

export function CalendarView({ sessions, month, basePath, link, names }: { sessions: SessionFull[]; month?: string; basePath: string; link: string; names?: Record<string, string> }) {
  const today = ymd(new Date().toISOString());
  const [y, m] = (month && /^\d{4}-\d{2}$/.test(month) ? month : today.slice(0, 7)).split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysIn = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = first.getUTCDay();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => `${y}-${String(m).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`)];
  while (cells.length % 7) cells.push(null);
  const prev = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const label = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);

  const byDay: Record<string, SessionFull[]> = {};
  sessions.forEach((s) => (byDay[ymd(s.starts_at)] ??= []).push(s));
  const monthList = sessions.filter((s) => ymd(s.starts_at).startsWith(`${y}-${String(m).padStart(2, "0")}`));

  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-semibold text-brand-800">{label}</h2>
          <div className="flex items-center gap-1">
            <Link href={`${basePath}?m=${prev}`} className="rounded-control p-1.5 hover:bg-paper" aria-label="Previous month"><ChevronLeft className="size-4" /></Link>
            <Link href={basePath} className="rounded-control px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">Today</Link>
            <Link href={`${basePath}?m=${next}`} className="rounded-control p-1.5 hover:bg-paper" aria-label="Next month"><ChevronRight className="size-4" /></Link>
          </div>
        </div>
        <div className="grid grid-cols-7 border-b border-line bg-paper text-center text-xs font-medium text-muted">
          {DAYS_SHORT.map((d) => <div key={d} className="py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((c, i) => (
            <div key={i} className={cn("min-h-[5.5rem] border-b border-r border-line p-1.5 text-xs [&:nth-child(7n)]:border-r-0", !c && "bg-paper/60")}>
              {c ? (
                <>
                  <span className={cn("inline-grid size-6 place-items-center rounded-full font-semibold", c === today ? "bg-brand-600 text-white" : "text-ink")}>{Number(c.slice(8))}</span>
                  <div className="mt-1 space-y-1">
                    {(byDay[c] ?? []).slice(0, 3).map((s) => (
                      <Link key={s.id} href={link} className={cn("block truncate rounded px-1.5 py-0.5 text-xs font-semibold ring-1 ring-inset", DOT[sessionStatus(s)])} title={`${subjectName(s.subject_id)} · ${fmtClock(s.starts_at)}`}>
                        <span className="hidden sm:inline">{fmtClock(s.starts_at)} </span>{subjectName(s.subject_id)}
                      </Link>
                    ))}
                    {(byDay[c]?.length ?? 0) > 3 ? <p className="px-1 text-xs text-muted">+{byDay[c].length - 3} more</p> : null}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 px-5 py-3 text-[11px] text-muted">
          {LEGEND.map(([k, l]) => (
            <span key={k} className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-sm ring-1 ring-inset", DOT[k])} aria-hidden /> {l}</span>
          ))}
        </div>
      </Card>

      <p className="eyebrow mb-3 mt-6">Sessions this month ({monthList.length})</p>
      {monthList.length ? (
        <Card className="divide-y divide-line">
          {monthList.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
              <span className="w-48 shrink-0 font-semibold">{fmtDateTime(s.starts_at, { weekday: "short", year: undefined })}</span>
              <span className="min-w-0 flex-1 truncate">{subjectName(s.subject_id)} · {s.duration_min} min{names ? ` · ${names[s.mentor_id] ?? ""}` : ""}</span>
              <StatusBadge status={sessionStatus(s)} />
            </div>
          ))}
        </Card>
      ) : (
        <p className="text-sm text-muted">No sessions in this month.</p>
      )}
    </>
  );
}
