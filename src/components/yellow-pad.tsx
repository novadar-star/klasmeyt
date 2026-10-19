import { cn } from "@/lib/utils";

/**
 * The signature surface: a Filipino "yellow pad" sheet with a worked problem.
 * Each line wipes in once on load (clip-path, staggered). Reduced motion: lines simply fade in.
 * Lines sit exactly on the 32px rules, starting right of the red margin.
 */
const STUDENT = "#22356b"; // ballpoint blue
const MENTOR = "#b4372b"; // mentor's red pen

type Line = { text: string; color?: string; size?: number; indent?: number };

const LINES: Line[] = [
  { text: "Calculus 2 — integration by parts", size: 17 },
  { text: "∫ x·eˣ dx = ?", size: 22 },
  { text: "u = x      dv = eˣ dx", indent: 14 },
  { text: "↳ LIATE: algebraic first, so u = x", color: MENTOR, size: 15, indent: 30 },
  { text: "du = dx    v = eˣ", indent: 14 },
  { text: "= x·eˣ − ∫ eˣ dx", size: 21 },
  { text: "= eˣ(x − 1) + C  ✓", size: 21 },
  { text: "nice! don't forget the +C", color: MENTOR, size: 15, indent: 120 },
];

export function YellowPad({ className, compact }: { className?: string; compact?: boolean }) {
  const lines = compact ? LINES.slice(0, 6) : LINES;
  return (
    <figure
      className={cn("yellow-pad relative overflow-hidden rounded-[6px] font-hand shadow-[0_1px_0_rgba(0,0,0,0.04),0_18px_40px_-18px_rgba(12,26,61,0.45)]", className)}
      aria-label="A mentor's worked solution to the integral of x times e to the x, equal to e to the x times x minus 1, plus C"
    >
      {/* binding holes */}
      <div className="absolute inset-x-0 top-0 h-6 bg-[#f3e6a6]" aria-hidden />
      <div className="relative pb-8 pl-[64px] pr-6 pt-[30px]" aria-hidden>
        {lines.map((l, i) => (
          <div key={i} className="flex h-8 items-end pb-[3px]">
            <span
              className="write-in whitespace-pre leading-none"
              style={{ ["--i" as string]: i, color: l.color ?? STUDENT, fontSize: l.size ?? 19, paddingLeft: l.indent ?? 0 }}
            >
              {l.text}
            </span>
          </div>
        ))}
      </div>
    </figure>
  );
}
