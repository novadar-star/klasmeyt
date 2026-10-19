import { DAYS, DAYS_SHORT, fmtTime } from "@/lib/utils";
import type { Slot } from "@/lib/types";

/** "Mon / Wed / Fri" */
export function daysText(slots: Slot[] = []) {
  const days = Array.from(new Set(slots.map((s) => s.day))).sort();
  return days.map((d) => DAYS_SHORT[d]).join(" / ") || "—";
}

/** "3:00 PM – 5:30 PM" when all slots share a time, otherwise per-day */
export function timeText(slots: Slot[] = []) {
  if (!slots.length) return "—";
  const uniq = Array.from(new Set(slots.map((s) => `${s.start_time}|${s.end_time}`)));
  if (uniq.length === 1) return `${fmtTime(slots[0].start_time)} – ${fmtTime(slots[0].end_time)}`;
  return "Varies by day";
}

export function SlotList({ slots = [] }: { slots?: Slot[] }) {
  if (!slots.length) return <span className="text-muted">—</span>;
  return (
    <ul className="space-y-1">
      {slots.map((s, i) => (
        <li key={i} className="text-sm">
          <span className="font-medium">{DAYS[s.day]}</span> <span className="text-muted">·</span> {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
        </li>
      ))}
    </ul>
  );
}
