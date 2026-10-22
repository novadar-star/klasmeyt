"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field } from "@/components/ui";
import { isTeamsLink, DAYS, cn, errMsg, fmtDateTime, fmtTime, manilaToISO, subjectName } from "@/lib/utils";

type S = { day: number; start: string; end: string };
export type Opt = { id: string; label: string; kind: "individual" | "group"; subject: number; mentor: string; mentees: string[]; slots: S[][] };

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const toHHMM = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const DURATIONS = [30, 60, 90, 120, 180];
const WEEKS_AHEAD = 4;

/** Intersect every mentee's agreed windows on a weekday (each is already intersected with the mentor's). */
function common(slots: S[][], day: number): [number, number][] {
  if (!slots.length) return [];
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

const manilaDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(d);
const manilaNowMin = () => toMin(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date()));

/** Start times (15-minute steps) inside the windows that leave room for the whole session. */
function startsFor(windows: [number, number][], duration: number, after: number) {
  const out: string[] = [];
  for (const [lo, hi] of windows) for (let t = Math.ceil(lo / 15) * 15; t + duration <= hi; t += 15) if (t > after) out.push(toHHMM(t));
  return out;
}

export function ScheduleForm({ options, initial, isMentor, replaces }: { options: Opt[]; initial?: string; isMentor: boolean; replaces: { id: string; group: string; starts_at: string } | null }) {
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

  // Upcoming dates (next 4 weeks) that have room for this duration inside the agreed schedule
  const dates = useMemo(() => {
    const today = manilaDate(new Date());
    const out: { iso: string; day: number }[] = [];
    for (let i = 0; i < WEEKS_AHEAD * 7; i++) {
      const iso = manilaDate(new Date(Date.now() + i * 86400000));
      const day = new Date(`${iso}T12:00:00+08:00`).getUTCDay();
      if (startsFor(weekly[day], duration, iso === today ? manilaNowMin() : -1).length) out.push({ iso, day });
    }
    return out;
  }, [weekly, duration]);

  const day = date ? new Date(`${date}T12:00:00+08:00`).getUTCDay() : null;
  const starts = useMemo(
    () => (day === null ? [] : startsFor(weekly[day], duration, date === manilaDate(new Date()) ? manilaNowMin() : -1)),
    [day, weekly, duration, date]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !time) return toast.error("Pick a date and a start time from the agreed schedule.");
    if (isMentor && !isTeamsLink(link)) return toast.error("Paste a Microsoft Teams meeting link (https://teams.microsoft.com/…).");
    setBusy(true);
    const { error } = await createClient().rpc("schedule_session", {
      p_group: gid,
      p_starts_at: manilaToISO(date, time),
      p_duration: duration,
      p_teams_link: link.trim() || null,
      p_notes: notes.trim() || null,
      p_replaces: replaces && replaces.group === gid ? replaces.id : null,
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(isMentor ? `Session proposed. ${g.mentees.length > 1 ? "Mentees were" : "Your mentee was"} invited to confirm attendance.` : "Session proposed. Your mentor will confirm it.");
    router.push("/sessions");
    router.refresh();
  }

  const anyCommon = weekly.some((w) => w.length);
  const who = g.mentees.length ? (isMentor ? g.mentees.join(", ") : g.mentor) : "";

  return (
    <form onSubmit={submit} className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <Card className="min-w-0 space-y-5 p-5 sm:p-6">
        {replaces ? (
          <p className="rounded-control bg-pad-100 px-3 py-2 text-sm text-pad-800">
            This replaces the pending session on {fmtDateTime(replaces.starts_at, { weekday: "short" })}. Mentees get a new invitation.
          </p>
        ) : null}
        <Field label={isMentor ? "Mentee or group" : "Mentor"} htmlFor="g">
          <select id="g" className="field" value={gid} onChange={(e) => { setGid(e.target.value); setDate(""); setTime(""); }} disabled={!!replaces}>
            {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Subject" hint="Set by the partnership"><input className="field font-semibold text-brand-700" value={subjectName(g.subject)} disabled /></Field>
          <Field label="Mentoring format" hint={g.kind === "group" ? `${g.mentees.length} mentees invited` : undefined}><input className="field" value={g.kind === "group" ? "Group" : "One-on-one"} disabled /></Field>
          <Field label="Duration" htmlFor="du">
            <select id="du" className="field" value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setDate(""); setTime(""); }}>
              {DURATIONS.map((d) => <option key={d} value={d}>{d >= 60 ? `${d / 60} hour${d > 60 ? "s" : ""}` : `${d} minutes`}</option>)}
            </select>
          </Field>
        </div>

        <fieldset>
          <legend className="label">Date</legend>
          {dates.length ? (
            <div className="flex flex-wrap gap-2">
              {dates.map((d) => {
                const on = date === d.iso;
                return (
                  <label key={d.iso} className={cn("press flex w-[4.75rem] cursor-pointer flex-col items-center rounded-control px-2 py-2 text-center ring-1 ring-inset has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-500", on ? "bg-brand-600 text-white ring-brand-600" : "bg-white text-ink ring-line hover:ring-brand-300")}>
                    <input type="radio" name="date" className="sr-only" checked={on} onChange={() => { setDate(d.iso); setTime(""); }} />
                    <span className={cn("text-[11px] font-medium", on ? "text-brand-100" : "text-muted")}>{DAYS[d.day].slice(0, 3)}</span>
                    <span className="num text-sm font-semibold">{new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" }).format(new Date(`${d.iso}T12:00:00+08:00`))}</span>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="rounded-control bg-paper px-3 py-2 text-sm text-muted">
              {anyCommon ? `No ${duration}-minute opening in the agreed schedule over the next ${WEEKS_AHEAD} weeks. Try a shorter duration.` : "There are no agreed hours to book in."}
            </p>
          )}
          <p className="mt-2 text-xs text-muted">Only dates inside the agreed schedule for the next {WEEKS_AHEAD} weeks are shown.</p>
        </fieldset>

        <Field label="Start time" htmlFor="tm">
          <select id="tm" className="field" value={time} onChange={(e) => setTime(e.target.value)} disabled={!date || !starts.length}>
            <option value="">{date ? "Choose a time…" : "Pick a date first"}</option>
            {starts.map((s) => <option key={s} value={s}>{fmtTime(s)} – {fmtTime(toHHMM(toMin(s) + duration))}</option>)}
          </select>
        </Field>

        {isMentor ? (
          <Field label="Microsoft Teams link" htmlFor="ln" hint="Klasmeyt doesn't create meetings. Paste the Teams link you created.">
            <input id="ln" type="url" inputMode="url" autoComplete="off" spellCheck={false} className="field" placeholder="https://teams.microsoft.com/l/meetup-join/…" value={link} onChange={(e) => setLink(e.target.value)} />
          </Field>
        ) : (
          <p className="rounded-control bg-paper px-3 py-2 text-xs text-muted">Your mentor adds the Microsoft Teams link when they confirm.</p>
        )}
        <Field label="Notes (optional)" htmlFor="no"><textarea id="no" rows={2} maxLength={1000} className="field" placeholder="Topics to cover, e.g. integration by parts…" value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-5">
          <Button type="button" variant="secondary" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={!dates.length}>{replaces ? "Propose new time" : "Propose session"}</Button>
        </div>
      </Card>

      <Card className="h-fit p-5">
        <p className="font-semibold text-brand-800">Agreed schedule</p>
        <p className="mt-1 text-xs text-muted">
          {g.kind === "group"
            ? `Hours that work for ${g.mentor} and every mentee (${who}), as agreed when each partnership was accepted.`
            : `Hours agreed between ${g.mentor} and ${g.mentees[0] ?? "the mentee"} when the partnership was accepted.`}
        </p>
        <ul className="mt-4 space-y-1.5">
          {DAYS.map((d, i) => (
            <li key={d} className={cn("flex justify-between gap-2 rounded-control px-2.5 py-1.5 text-xs", weekly[i].length ? "bg-brand-50 text-brand-800" : "text-slate-400", day === i && "ring-1 ring-brand-500")}>
              <span className="font-semibold">{d}</span>
              <span className="text-right">{weekly[i].length ? weekly[i].map(([a, b]) => `${fmtTime(toHHMM(a))}–${fmtTime(toHHMM(b))}`).join(", ") : "—"}</span>
            </li>
          ))}
        </ul>
        {!anyCommon ? (
          <p className="mt-3 text-xs text-red-700">
            {g.kind === "group" ? "These mentees have no agreed hours in common. Schedule with them in smaller groups or one-on-one." : "No hours were agreed when this partnership was accepted."}
          </p>
        ) : null}
      </Card>
    </form>
  );
}
