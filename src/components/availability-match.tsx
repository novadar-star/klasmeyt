import { BadgeCheck, Video } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hero illustration of Klasmeyt's core mechanic: two weekly schedules, the hours both are free,
 * and the session that lands inside them. Built from real UI, not an image.
 * Motion: one load sequence — bars wipe up (clip-path), then the session block settles in. Reduced motion: fade only.
 */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START = 12; // 12 PM
const HOURS = 6; // to 6 PM
const ROW = 30; // px per hour

type Block = { day: number; from: number; to: number };
const mentee: Block[] = [
  { day: 1, from: 14, to: 17 },
  { day: 3, from: 14, to: 17 },
  { day: 4, from: 13, to: 17 },
];
const mentor: Block[] = [
  { day: 1, from: 13, to: 17 },
  { day: 2, from: 15, to: 17.5 },
  { day: 3, from: 13, to: 17 },
];
const overlap: Block[] = [
  { day: 1, from: 14, to: 17 },
  { day: 3, from: 14, to: 17 },
];
const session: Block = { day: 3, from: 14, to: 16 };

const pos = (b: Block) => ({ top: (b.from - START) * ROW, height: (b.to - b.from) * ROW });
const label = (h: number) => `${h > 12 ? h - 12 : h} PM`;

export function AvailabilityMatch({ className }: { className?: string }) {
  let n = 0;
  return (
    <figure className={cn("rounded-panel bg-white text-ink shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]", className)}>
      <figcaption className="sr-only">
        Example match: a mentee and a verified Calculus 2 mentor are both free Tuesday and Thursday from 2 to 5 PM. Their session is confirmed for Thursday, 2 to 4 PM, on Microsoft Teams.
      </figcaption>

      <div aria-hidden>
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="text-[13px] text-muted">Matched for Calculus 2</p>
            <p className="mt-0.5 text-[15px] font-semibold text-brand-800">Kenneth &amp; Dhennise</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-2 py-0.5 text-xs font-medium text-white">
            <BadgeCheck className="size-3.5" /> Verified mentor
          </span>
        </div>

        <div className="px-5 pb-4 pt-4">
          <div className="grid grid-cols-[2.25rem_repeat(5,1fr)] gap-x-1.5">
            <span />
            {DAYS.map((d) => (
              <span key={d} className="pb-2 text-center text-xs font-medium text-muted">{d}</span>
            ))}

            {/* hour labels */}
            <div className="relative" style={{ height: HOURS * ROW }}>
              {Array.from({ length: HOURS + 1 }, (_, i) => (
                <span key={i} className="num absolute -translate-y-1/2 text-[10px] text-muted" style={{ top: i * ROW }}>
                  {i % 2 === 0 ? label(START + i) : ""}
                </span>
              ))}
            </div>

            {DAYS.map((_, day) => (
              <div key={day} className="relative rounded-[6px] bg-paper" style={{ height: HOURS * ROW }}>
                {/* hour lines */}
                {Array.from({ length: HOURS - 1 }, (_, i) => (
                  <span key={i} className="absolute inset-x-0 border-t border-dashed border-line" style={{ top: (i + 1) * ROW }} />
                ))}
                {overlap.filter((b) => b.day === day).map((b, i) => (
                  <span key={`o${i}`} className="match-in absolute -inset-x-0.5 rounded-[6px] border border-dashed border-brand-400 bg-brand-100" style={{ ...pos(b), ["--i" as string]: 7 }} />
                ))}
                {mentee.filter((b) => b.day === day).map((b, i) => (
                  <span key={`e${i}`} className="bar-in absolute left-1 w-[calc(50%-6px)] rounded-[4px] bg-pad-300" style={{ ...pos(b), ["--i" as string]: n++ }} />
                ))}
                {mentor.filter((b) => b.day === day).map((b, i) => (
                  <span key={`m${i}`} className="bar-in absolute right-1 w-[calc(50%-6px)] rounded-[4px] bg-brand-500" style={{ ...pos(b), ["--i" as string]: n++ }} />
                ))}
                {session.day === day ? (
                  <span
                    className="session-in absolute inset-x-1 grid place-items-center rounded-[5px] bg-brand-700 text-[11px] font-semibold text-white ring-2 ring-white"
                    style={{ ...pos(session) }}
                  >
                    Session
                  </span>
                ) : null}
              </div>
            ))}
          </div>

          <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-pad-300" /> Kenneth is free</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-brand-500" /> Dhennise is free</li>
            <li className="flex items-center gap-1.5"><span className="size-2.5 rounded-[3px] bg-brand-100 ring-1 ring-inset ring-brand-200" /> Free together</li>
          </ul>
        </div>

        <div className="session-in flex items-center justify-between gap-3 rounded-b-panel border-t border-line bg-paper px-5 py-3.5">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-800">Thu, 2:00 – 4:00 PM</p>
            <p className="text-xs text-muted">Confirmed by both · integration by parts</p>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-control bg-brand-600 px-3 py-1.5 text-[13px] font-semibold text-white">
            <Video className="size-4" /> Join on Teams
          </span>
        </div>
      </div>
    </figure>
  );
}
