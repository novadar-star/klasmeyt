/**
 * Login illustration: "Matched schedule".
 * Hand-built SVG drawn only from the brand tokens, so it reads as part of the app rather than stock art.
 * The calendar uses the app's own schedule language (DESIGN.md §1): yellow = mentee free,
 * light blue = mentor free, solid blue = the hour they share. Text is live, set in the display face.
 */

// Torn top edge of the calendar sheet: deterministic jitter so server and client render the same path.
const TORN = (() => {
  const x0 = 104, x1 = 524, y = 104;
  let d = `M${x0} ${y + 6}`;
  let seed = 7;
  for (let x = x0 + 10; x < x1; x += 10) {
    seed = (seed * 9301 + 49297) % 233280;
    d += ` L${x} ${y + Math.round((seed / 233280) * 10)}`;
  }
  return `${d} L${x1} ${y + 4}`;
})();

const COLS = 5, ROWS = 4;
const GX = 136, GY = 184, CW = 71.2, CH = 54;
const MENTEE: [number, number][] = [[1, 1], [1, 2], [2, 2]];
const MENTOR: [number, number][] = [[2, 0], [3, 1], [3, 2]];
const SHARED: [number, number] = [2, 1];

const cell = ([c, r]: [number, number], fill: string, key: string) => (
  <rect key={key} x={GX + c * CW} y={GY + r * CH} width={CW} height={CH} fill={fill} />
);

export function MatchIllustration({ className }: { className?: string }) {
  const [sc, sr] = SHARED;
  const cx = GX + sc * CW + CW / 2, cy = GY + sr * CH + CH / 2;
  return (
    <svg viewBox="0 0 640 600" className={className} role="img" aria-labelledby="match-title">
      <title id="match-title">A mentee and a mentor beside a weekly calendar with one shared hour highlighted: matched schedule.</title>
      <defs>
        <pattern id="mi-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.9" fill="#1D4196" />
        </pattern>
        <linearGradient id="mi-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="mi-fade-mask">
          <rect x="90" y="90" width="460" height="90" fill="url(#mi-fade)" />
        </mask>
        <clipPath id="mi-sheet">
          <path d={`${TORN} L524 414 Q524 430 508 430 L120 430 Q104 430 104 414 Z`} />
        </clipPath>
      </defs>

      {/* Calendar, tilted slightly */}
      <g transform="rotate(-4 320 270)">
        {/* back sheet / shadow */}
        <rect x="118" y="122" width="420" height="324" rx="16" fill="#173478" />
        <rect x="118" y="122" width="420" height="324" rx="16" fill="url(#mi-dots)" opacity="0.5" />
        {/* front sheet */}
        <g clipPath="url(#mi-sheet)">
          <rect x="100" y="96" width="430" height="340" fill="#F8FAFE" />
          <rect x="100" y="96" width="430" height="90" fill="url(#mi-dots)" mask="url(#mi-fade-mask)" />
        </g>
        <path d={`${TORN} L524 414 Q524 430 508 430 L120 430 Q104 430 104 414 Z`} fill="none" stroke="#1D4196" strokeWidth="3" strokeLinejoin="round" />

        {/* rings */}
        {[176, 452].map((x) => (
          <g key={x}>
            <circle cx={x} cy="132" r="9" fill="#fff" stroke="#0C1A3D" strokeWidth="3" />
            <path d={`M${x} 136 V96 a6 6 0 0 1 12 0 V112`} fill="none" stroke="#0C1A3D" strokeWidth="4" strokeLinecap="round" />
          </g>
        ))}

        {/* schedule grid */}
        {MENTEE.map((c, i) => cell(c, "#FBE79A", `e${i}`))}
        {MENTOR.map((c, i) => cell(c, "#DCE5F6", `o${i}`))}
        {cell(SHARED, "#1D4196", "s")}
        <g stroke="#5479C4" strokeWidth="2">
          {Array.from({ length: COLS - 1 }, (_, i) => <line key={`v${i}`} x1={GX + (i + 1) * CW} y1={GY} x2={GX + (i + 1) * CW} y2={GY + ROWS * CH} />)}
          {Array.from({ length: ROWS - 1 }, (_, i) => <line key={`h${i}`} x1={GX} y1={GY + (i + 1) * CH} x2={GX + COLS * CW} y2={GY + (i + 1) * CH} />)}
        </g>
        <rect x={GX} y={GY} width={COLS * CW} height={ROWS * CH} fill="none" stroke="#1D4196" strokeWidth="3" rx="2" />
        <path d={`M${cx - 13} ${cy + 1} l9 9 l18 -19`} fill="none" stroke="#fff" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Figures: one silhouette system, sticker-style white outline */}
      <g stroke="#fff" strokeWidth="8" strokeLinejoin="round" paintOrder="stroke">
        {/* mentee, reading */}
        <path d="M70 520 C70 448 98 404 156 404 C214 404 242 448 242 520 Z" fill="#0C1A3D" />
        <circle cx="156" cy="352" r="40" fill="#0C1A3D" />
        <path d="M98 404 L156 418 L214 404 L214 456 L156 470 L98 456 Z" fill="#1D4196" />
        <path d="M106 398 L156 412 V462 L106 450 Z M206 398 L156 412 V462 L206 450 Z" fill="#fff" stroke="#0C1A3D" strokeWidth="3" />
        {/* mentor, pointing with a pencil */}
        <path d="M402 520 C402 450 430 408 488 408 C546 408 574 450 574 520 Z" fill="#0C1A3D" />
        <circle cx="488" cy="356" r="40" fill="#0C1A3D" />
      </g>
      <g transform="rotate(-32 424 420)">
        <rect x="414" y="350" width="20" height="74" rx="3" fill="#F4D65F" stroke="#0C1A3D" strokeWidth="3" />
        <path d="M414 352 L424 326 L434 352 Z" fill="#FFF3C4" stroke="#0C1A3D" strokeWidth="3" strokeLinejoin="round" />
        <path d="M420.5 336 L424 326 L427.5 336 Z" fill="#0C1A3D" />
      </g>
      <circle cx="430" cy="434" r="16" fill="#0C1A3D" stroke="#fff" strokeWidth="6" />

      {/* Motion marks: few, deliberate, all round-capped */}
      <g stroke="#2C55AD" strokeWidth="7" strokeLinecap="round">
        <path d="M84 318 l-20 -10" />
        <path d="M98 290 l-12 -18" />
        <path d="M560 322 l20 -10" />
        <path d="M548 294 l12 -18" />
      </g>

      {/* Banner */}
      <g transform="rotate(-3 320 520)">
        <rect x="60" y="486" width="520" height="76" rx="38" fill="#173478" />
        <rect x="60" y="474" width="520" height="76" rx="38" fill="#fff" stroke="#1D4196" strokeWidth="5" />
        <rect x="170" y="494" width="38" height="36" rx="7" fill="#DCE5F6" stroke="#1D4196" strokeWidth="3.5" />
        <path d="M170 504 H208" stroke="#1D4196" strokeWidth="3.5" />
        <path d="M179 490 v8 M199 490 v8" stroke="#1D4196" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M180 517 l6 6 l12 -12" fill="none" stroke="#1D4196" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <text x="224" y="526" fill="#0C1A3D" fontSize="40" fontWeight="700" letterSpacing="-0.4" style={{ fontStretch: "76%" }}>
          Matched schedule
        </text>
      </g>
    </svg>
  );
}
