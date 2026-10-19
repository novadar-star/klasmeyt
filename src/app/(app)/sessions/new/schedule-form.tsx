"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field } from "@/components/ui";
import { DAYS, cn, errMsg, fmtTime, manilaToISO, subjectName } from "@/lib/utils";

type S = { day: number; start: string; end: string };
export type Opt = { id: string; label: string; kind: "individual" | "group"; subject: number; mentor: string; mentees: string[]; slots: S[][] };

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

/** intersect everyone's windows on a weekday */
function common(slots: S[][], day: number): [number, number][] {
  let acc: [number, number][] | null = null;
  for (const person of slots) {
    const mine = person.filter((s) => s.day === day).map((s) => [toMin(s.start), toMin(s.end)] as [number, number]);
    if (acc === null) {
      acc = mine;
      continue;
    }
    const next: [number, number][] = [];
    for (const a of acc) for (const b of mine) {
      const lo = Math.max(a[0], b[0]);
      const hi = Math.min(a[1], b[1]);
      if (hi > lo) next.push([lo, hi]);
    }
    acc = next;
  }
  return (acc ?? []).sort((a, b) => a[0] - b[0]);
}

function manilaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
}

export function ScheduleForm({ options, initial, isMentor }: { options: Opt[]; initial?: string; isMentor: boolean }) {
  const router = useRouter();
  const [gid, setGid] = useState(options.find((o) => o.id === initial)?.id ?? options[0].id);
  const g = options.find((o) => o.id === gid)!;
  const [date, setDate] = useState("");
  const [duration, setDuration] = useState(60);
  const [time, setTime] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const weekly = useMemo(() => DAYS.map((_, d) => common(g.slots, d)), [g]);
  const day = date ? new Date(`${date}T12:00:00+08:00`).getUTCDay() : null;
  const windows = useMemo(() => (day === null ? [] : weekly[day]), [day, weekly]);
  const starts = useMemo(() => {
    const out: string[] = [];
    for (const [lo, hi] of windows) for (let t = Math.ceil(lo / 15) * 15; t + duration <= hi; t += 15) out.push(toHHMM(t));
    return out;
  }, [windows, duration]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return toast.error("Pick a date and a start time inside the shared availability.");
    if (isMentor && !/^https:\/\//i.test(link.trim())) return toast.error("Add the Microsoft Teams link (starting with https://).");
    setBusy(true);
    const { error } = await createClient().rpc("propose_session", {
      p_group: gid,
      p_starts_at: manilaToISO(date, time),
      p_duration: duration,
      p_teams_link: link.trim() || null,
      p_notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(isMentor ? "Session proposed. Mentees were invited to confirm." : "Session proposed. Your mentor will confirm it.");
    router.push("/sessions");
    router.refresh();
  }

  const anyCommon = weekly.some((w) => w.length);

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <Card className="space-y-5 p-6">
        <Field label={isMentor ? "Mentee or group" : "Mentor"} htmlFor="g">
          <select id="g" className="field" value={gid} onChange={(e) => { setGid(e.target.value); setTime(""); }}>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Subject"><input className="field font-semibold text-teal-700" value={subjectName(g.subject)} disabled /></Field>
          <Field label="Mentoring format"><input className="field" value={g.kind === "group" ? "Group" : "One-on-one"} disabled /></Field>
          <Field label="Duration" htmlFor="du">
            <select id="du" className="field" value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setTime(""); }}>
              {[30, 60, 90, 120, 180].map((d) => <option key={d} value={d}>{d >= 60 ? `${d / 60} hour${d > 60 ? "s" : ""}` : `${d} minutes`}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Date" htmlFor="dt">
            <input id="dt" type="date" className="field" min={manilaToday()} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} />
          </Field>
          <Field label="Start time" htmlFor="tm" hint={date && !starts.length ? `No shared ${duration}-minute window on ${DAYS[day!]}s. Pick a highlighted day.` : undefined}>
            <select id="tm" className="field" value={time} onChange={(e) => setTime(e.target.value)} disabled={!date || !starts.length}>
              <option value="">{date ? (starts.length ? "Choose a time…" : "No available times") : "Pick a date first"}</option>
              {starts.map((s) => <option key={s} value={s}>{fmtTime(s)} – {fmtTime(toHHMM(toMin(s) + duration))}</option>)}
            </select>
          </Field>
        </div>
        {isMentor ? (
          <Field label="Microsoft Teams link" htmlFor="ln" hint="Klasmeyt doesn't create meetings. Paste the Teams link you created.">
            <input id="ln" className="field" placeholder="https://teams.microsoft.com/l/meetup-join/…" value={link} onChange={(e) => setLink(e.target.value)} />
          </Field>
        ) : (
          <p className="rounded-md bg-paper px-3 py-2 text-xs text-muted">Your mentor adds the Microsoft Teams link when they confirm.</p>
        )}
        <Field label="Notes (optional)" htmlFor="no"><textarea id="no" rows={2} className="field" placeholder="Topics to cover, e.g. integration by parts" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="flex justify-end gap-2 border-t border-line pt-5">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Propose session"}</Button>
        </div>
      </Card>

      <Card className="h-fit p-5">
        <p className="font-bold text-brand-700">Shared availability</p>
        <p className="mt-1 text-xs text-muted">Times when {g.mentor}{g.mentees.length ? ` and ${g.mentees.join(", ")}` : ""} are all free.</p>
        <ul className="mt-4 space-y-1.5">
          {DAYS.map((d, i) => (
            <li key={d} className={cn("flex justify-between gap-2 rounded-md px-2.5 py-1.5 text-xs", weekly[i].length ? "bg-teal-50 text-teal-800" : "text-slate-400", day === i && "ring-1 ring-teal-500")}>
              <span className="font-semibold">{d}</span>
              <span className="text-right">{weekly[i].length ? weekly[i].map(([a, b]) => `${fmtTime(toHHMM(a))}–${fmtTime(toHHMM(b))}`).join(", ") : "—"}</span>
            </li>
          ))}
        </ul>
        {!anyCommon ? <p className="mt-3 text-xs text-red-600">No overlapping availability. Ask each other to update availability in Profile.</p> : null}
      </Card>
    </form>
  );
}
