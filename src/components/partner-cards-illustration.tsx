import { cn } from "@/lib/utils";
/**
 * Landing "From request to review session": a mentor and a mentee card, paired.
 * Same drawing system as the login illustration (match-illustration.tsx): brand tokens only,
 * navy silhouettes, solid offset shadows, halftone dots. Colors follow the schedule language:
 * mentor = light blue, mentee = yellow, and the check is solid blue because blue means
 * "an arrangement is in place" (green is reserved for verification).
 */

type CardProps = { x: number; y: number; rotate: number; tint: string; band: string; role: "Mentor" | "Mentee"; id: string };

function Card({ x, y, rotate, tint, band, role, id }: CardProps) {
  const w = 360, h = 230;
  return (
    <g transform={`rotate(${rotate} ${x + w / 2} ${y + h / 2})`}>
      <rect x={x + 10} y={y + 12} width={w} height={h} rx="18" fill="#173478" />
      <rect x={x} y={y} width={w} height={h} rx="18" fill={tint} stroke="#0C1A3D" strokeWidth="3" />
      {/* halftone band along the top edge */}
      <rect x={x + 1.5} y={y + 1.5} width={w - 3} height="34" rx="16" fill={`url(#${id}-dots)`} mask={`url(#${id}-fade)`} />

      {/* photo */}
      <rect x={x + 24} y={y + 46} width="86" height="86" rx="10" fill="#fff" stroke="#0C1A3D" strokeWidth="3" />
      <g clipPath={`url(#${id}-photo)`}>
        <circle cx={x + 67} cy={y + 80} r="17" fill="#0C1A3D" />
        <path d={`M${x + 34} ${y + 134} C${x + 34} ${y + 112} ${x + 46} ${y + 101} ${x + 67} ${y + 101} C${x + 88} ${y + 101} ${x + 100} ${y + 112} ${x + 100} ${y + 134} Z`} fill="#0C1A3D" />
        {role === "Mentee" ? (
          <path d={`M${x + 46} ${y + 112} L${x + 67} ${y + 118} L${x + 88} ${y + 112} V${y + 132} L${x + 67} ${y + 138} L${x + 46} ${y + 132} Z`} fill="#fff" stroke="#0C1A3D" strokeWidth="2.5" strokeLinejoin="round" />
        ) : (
          <g transform={`rotate(-28 ${x + 86} ${y + 112})`}>
            <rect x={x + 82} y={y + 92} width="8" height="28" rx="1.5" fill="#F4D65F" stroke="#0C1A3D" strokeWidth="2" />
            <path d={`M${x + 82} ${y + 93} L${x + 86} ${y + 83} L${x + 90} ${y + 93} Z`} fill="#0C1A3D" />
          </g>
        )}
      </g>

      {/* role label + subject chip */}
      <rect x={x + 128} y={y + 50} width="142" height="34" rx="8" fill="#fff" stroke="#0C1A3D" strokeWidth="3" />
      <text x={x + 142} y={y + 75} fill="#0C1A3D" fontSize="22" fontWeight="700" style={{ fontStretch: "76%" }}>{role}</text>
      <rect x={x + 128} y={y + 96} width="104" height="28" rx="14" fill={band} />
      <text x={x + 142} y={y + 115} fill="#0C1A3D" fontSize="14" fontWeight="600">Calculus 2</text>

      {/* seal */}
      <circle cx={x + 314} cy={y + 80} r="26" fill="#fff" stroke="#0C1A3D" strokeWidth="3" />
      <circle cx={x + 314} cy={y + 80} r="17" fill="none" stroke={band} strokeWidth="3" strokeDasharray="4 4" />

      {/* details */}
      <path d={`M${x + 24} ${y + 160} H${x + w - 24}`} stroke="#0C1A3D" strokeWidth="4" strokeLinecap="round" strokeDasharray="26 14" />
      <path d={`M${x + 24} ${y + 188} H${x + 200}`} stroke="#0C1A3D" strokeWidth="4" strokeLinecap="round" />
      <path d={`M${x + 24} ${y + 208} H${x + 130}`} stroke="#0C1A3D" strokeWidth="4" strokeLinecap="round" />

      <defs>
        <pattern id={`${id}-dots`} width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.7" fill="#1D4196" />
        </pattern>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-fade`}>
          <rect x={x} y={y} width={w} height="36" fill={`url(#${id}-g)`} />
        </mask>
        <clipPath id={`${id}-photo`}>
          <rect x={x + 25.5} y={y + 47.5} width="83" height="83" rx="9" />
        </clipPath>
      </defs>
    </g>
  );
}

export function PartnerCardsIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 700 470" className={cn("select-none", className)} aria-hidden="true" focusable="false">
      <Card id="pc-mentor" x={40} y={40} rotate={-3} tint="#DCE5F6" band="#B9CBEC" role="Mentor" />
      <Card id="pc-mentee" x={290} y={196} rotate={2} tint="#FFF3C4" band="#F4D65F" role="Mentee" />
      {/* the pairing */}
      <g>
        <circle cx="534" cy="106" r="50" fill="#173478" transform="translate(6 7)" />
        <circle cx="534" cy="106" r="50" fill="#1D4196" stroke="#fff" strokeWidth="6" />
        <path d="M512 107 l15 15 l29 -31" fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}
