import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Klasmeyt's one signature visual: a weekly timetable, read the way students read their class schedule.
 * Each weekday is a row; the mentee's free hours (yellow) and the mentor's (blue) run side by side,
 * the hours they share are marked, and the session sits inside them.
 *
 * The data mirrors the seeded demo pair (Kenneth and Dhennise, Calculus 2), so what the panel sees here
 * is what they'll find after logging in. It's labeled as an example on screen.
 *
 * Motion: one load sequence. Lanes draw left to right (clip-path), the overlap fades in, the session settles.
 * Reduced motion: fade only.
 */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const START = 12; // 12 PM
const END = 18; // 6 PM
const SPAN = END - START;

type Block = { day: number; from: number; to: number };
const mentee: Block[] = [
  { day: 1, from: 14, to: 17 },
  { day: 3, from: 14, to: 17 },
  { day: 4, from: 13, to: 17 },
];
const mentor: Block[] = [
  { day: 1, from: 13, to: 17 },
  { day: 3, from: 13, to: 17 },
];
const overlap: Block[] = [
  { day: 1, from: 14, to: 17 },
  { day: 3, from: 14, to: 17 },
];
const session: Block = { day: 3, from: 14, to: 16 };

const x = (b: Block) => ({ left: `${((b.from - START) / SPAN) * 100}%`, width: `${((b.to - b.from) / SPAN) * 100}%` });
const hour = (h: number) => (h === 12 ? "12" : String(h - 12));

export function AvailabilityMatch({ className, tone = "light" }: { className?: string; tone?: "light" | "dark" }) {
  let n = 0;
  const dark = tone === "dark";
  return (
    <figure className={cn("text-ink", className)}>
      <figcaption className="sr-only">
        Example match for Calculus 2. Kenneth, the mentee, is free Tuesday and Thursday from 2 to 5 PM and Friday from 1 to 5 PM. Dhennise, a
        verified mentor, is free Tuesday and Thursday from 1 to 5 PM. They are both free Tuesday and Thursday from 2 to 5 PM, and their session is
        confirmed for Thursday, 2 to 4 PM, on Microsoft Teams.
      </figcaption>

      <div aria-hidden>
        {/* Who is being matched */}
        <div className={cn("flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[13px]", dark ? "text-brand-200" : "text-muted")}>
          <span className={cn("rounded-[4px] px-1.5 py-0.5 text-[11px] font-semibold", dark ? "bg-white/10 text-white" : "bg-paper text-muted ring-1 ring-inset ring-line")}>
            Example
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-pad-300" />
            <span><span className={dark ? "text-white" : "text-ink"}>Kenneth</span>, needs help in Calculus 2</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-full bg-brand-500" />
            <span className={dark ? "text-white" : "text-ink"}>Dhennise</span>
            <BadgeCheck className={cn("size-3.5", dark ? "text-brand-200" : "text-brand-600")} />
            verified mentor, already passed it
          </span>
        </div>

        {/* Timetable */}
        <div className="mt-5 grid grid-cols-[2.5rem_1fr] sm:grid-cols-[3rem_1fr]">
          {/* hour axis */}
          <span />
          <div className="relative mb-2 h-4">
            {Array.from({ length: SPAN + 1 }, (_, i) => (
              <span
                key={i}
                className={cn("num absolute -translate-x-1/2 whitespace-nowrap text-[11px]", dark ? "text-brand-300" : "text-muted", i === SPAN && "-translate-x-full", i === 0 && "translate-x-0")}
                style={{ left: `${(i / SPAN) * 100}%` }}
              >
                {hour(START + i)}
                {i === 0 || i === SPAN ? " PM" : ""}
              </span>
            ))}
          </div>

          {DAYS.map((d, day) => {
            const isSessionDay = session.day === day;
            return (
              <div key={d} className="contents">
                <span className={cn("flex items-center text-[13px] font-medium", dark ? "text-brand-200" : "text-muted")}>{d}</span>
                <div className={cn("relative h-11 border-t", dark ? "border-white/10" : "border-line", day === DAYS.length - 1 && (dark ? "border-b border-b-white/10" : "border-b"))}>
                  {/* hour ticks */}
                  {Array.from({ length: SPAN - 1 }, (_, i) => (
                    <span key={i} className={cn("absolute inset-y-0 border-l border-dashed", dark ? "border-white/[0.07]" : "border-line")} style={{ left: `${((i + 1) / SPAN) * 100}%` }} />
                  ))}
                  {overlap.filter((b) => b.day === day).map((b, i) => (
                    <span
                      key={`o${i}`}
                      className={cn("match-in absolute inset-y-1 rounded-[6px] border border-dashed", dark ? "border-brand-300/70 bg-brand-400/25" : "border-brand-300 bg-brand-100/70")}
                      style={x(b)}
                    />
                  ))}
                  {mentee.filter((b) => b.day === day).map((b, i) => (
                    <span key={`e${i}`} className="bar-in absolute top-[13px] h-2 rounded-full bg-pad-300" style={{ ...x(b), ["--i" as string]: n++ }} />
                  ))}
                  {mentor.filter((b) => b.day === day).map((b, i) => (
                    <span key={`m${i}`} className="bar-in absolute top-[23px] h-2 rounded-full bg-brand-500" style={{ ...x(b), ["--i" as string]: n++ }} />
                  ))}
                  {isSessionDay ? (
                    <span
                      className={cn("session-in absolute inset-y-1.5 flex items-center rounded-[5px] px-2 text-[12px] font-semibold text-white", dark ? "bg-brand-500 shadow-[0_0_0_2px_#0C1A3D]" : "bg-brand-700 shadow-[0_0_0_2px_white]")}
                      style={x(session)}
                    >
                      <span className="truncate">Session</span>
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* The outcome */}
        <div className={cn("session-in mt-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 text-[13px]", dark ? "text-brand-200" : "text-muted")}>
          <p>
            <span className={cn("font-semibold", dark ? "text-white" : "text-brand-800")}>Thursday, 2:00 to 4:00 PM</span> on Microsoft Teams. Both confirmed.
          </p>
          <p>Shaded hours: free together</p>
        </div>
      </div>
    </figure>
  );
}
