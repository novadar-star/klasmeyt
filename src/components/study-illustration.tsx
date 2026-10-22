/**
 * Landing hero: a mentee and a mentor talking it through at one table.
 * Third piece in the same drawing system as match-illustration.tsx and partner-cards-illustration.tsx:
 * brand tokens only, navy silhouettes with a white sticker outline, solid offset shadows, halftone dots.
 * Speech bubbles carry the role colors: the mentee asks (yellow, "?"), the mentor answers (light blue, typing).
 */

export function StudyIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 900 430" className={className} role="img" aria-labelledby="study-title">
      <title id="study-title">A mentee asks a question and a mentor answers from a laptop, sitting across one table.</title>
      <defs>
        <pattern id="st-dots" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.8" fill="#1D4196" />
        </pattern>
        <pattern id="st-dots-light" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="3.5" cy="3.5" r="1.6" fill="#5479C4" />
        </pattern>
        <linearGradient id="st-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id="st-fade">
          <rect x="0" y="0" width="900" height="430" fill="url(#st-g)" />
        </mask>
      </defs>

      <rect x="30" y="14" width="840" height="402" rx="40" fill="#EFF3FB" />

      {/* Bubbles */}
      <g className="pop-in" style={{ "--d": "250ms", transformOrigin: "40% 100%" } as React.CSSProperties}>
        <rect x="262" y="58" width="104" height="72" rx="20" fill="#173478" transform="translate(6 7)" />
        <path d="M262 78 a20 20 0 0 1 20 -20 h64 a20 20 0 0 1 20 20 v32 a20 20 0 0 1 -20 20 h-36 l-22 22 v-22 h-6 a20 20 0 0 1 -20 -20 Z" fill="#FFF3C4" stroke="#0C1A3D" strokeWidth="3" strokeLinejoin="round" />
        <text x="314" y="111" textAnchor="middle" fill="#0C1A3D" fontSize="46" fontWeight="700" style={{ fontStretch: "76%" }}>?</text>
      </g>
      <g className="pop-in" style={{ "--d": "800ms", transformOrigin: "75% 100%" } as React.CSSProperties}>
        <rect x="528" y="38" width="128" height="72" rx="20" fill="#173478" transform="translate(6 7)" />
        <path d="M528 58 a20 20 0 0 1 20 -20 h88 a20 20 0 0 1 20 20 v32 a20 20 0 0 1 -20 20 h-6 v22 l-22 -22 h-60 a20 20 0 0 1 -20 -20 Z" fill="#DCE5F6" stroke="#0C1A3D" strokeWidth="3" strokeLinejoin="round" />
        {[566, 592, 618].map((x) => <circle key={x} cx={x} cy="74" r="7" fill="#1D4196" />)}
      </g>

      {/* Motion marks */}
      <g className="fade-late" style={{ "--d": "1100ms" } as React.CSSProperties} stroke="#2C55AD" strokeWidth="7" strokeLinecap="round">
        <path d="M236 92 l-20 -8" />
        <path d="M244 64 l-14 -16" />
        <path d="M682 72 l20 -8" />
        <path d="M676 44 l14 -16" />
      </g>

      {/* Books by the mentee */}
      <g stroke="#0C1A3D" strokeWidth="3" strokeLinejoin="round">
        <rect x="300" y="322" width="118" height="22" rx="4" fill="#F4D65F" />
        <path d="M312 333 h94" stroke="#0C1A3D" strokeWidth="2" opacity="0.5" />
        <rect x="312" y="302" width="96" height="20" rx="4" fill="#B9CBEC" transform="rotate(-3 360 312)" />
      </g>

      {/* People: navy heads, blue shirts with a navy outline (same strokes as the cards) */}
      <g stroke="#0C1A3D" strokeWidth="3" strokeLinejoin="round">
        {/* mentee: ponytail, hand up while asking */}
        <circle cx="186" cy="178" r="18" fill="#0C1A3D" />
        <path d="M134 360 C134 284 170 250 232 250 C294 250 330 284 330 360 Z" fill="#1D4196" />
        <path d="M134 360 C134 284 170 250 232 250 C294 250 330 284 330 360 Z" fill="url(#st-dots)" opacity="0.45" />
        <circle cx="232" cy="192" r="44" fill="#0C1A3D" />
        <path d="M296 286 L346 312 L370 262" fill="none" stroke="#0C1A3D" strokeWidth="28" strokeLinecap="round" />
        <path d="M296 286 L346 312 L370 262" fill="none" stroke="#1D4196" strokeWidth="22" strokeLinecap="round" />
        <circle cx="372" cy="252" r="14" fill="#0C1A3D" />
        {/* mentor: short hair, at the laptop */}
        <path d="M570 360 C570 282 606 248 668 248 C730 248 766 282 766 360 Z" fill="#1D4196" />
        <path d="M570 360 C570 282 606 248 668 248 C730 248 766 282 766 360 Z" fill="url(#st-dots)" opacity="0.45" />
        <circle cx="668" cy="188" r="46" fill="#0C1A3D" />
      </g>
      <g fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M214 252 l18 18 l18 -18" />
        <path d="M650 250 l18 18 l18 -18" />
      </g>
      <rect x="194" y="168" width="10" height="20" rx="3" fill="#F4D65F" stroke="#0C1A3D" strokeWidth="2.5" transform="rotate(-20 199 178)" />

      {/* Laptop, screen facing the mentor */}
      <g>
        <path d="M482 252 h120 a10 10 0 0 1 10 10 v80 h-140 v-80 a10 10 0 0 1 10 -10 Z" fill="#1D4196" stroke="#0C1A3D" strokeWidth="3" />
        <path d="M482 252 h120 a10 10 0 0 1 10 10 v80 h-140 v-80 a10 10 0 0 1 10 -10 Z" fill="url(#st-dots-light)" opacity="0.6" mask="url(#st-fade)" />
        <circle cx="542" cy="296" r="8" fill="#fff" />
        <rect x="452" y="340" width="186" height="12" rx="4" fill="#0C1A3D" />
      </g>

      {/* Table */}
      <rect x="86" y="362" width="736" height="30" rx="10" fill="#173478" />
      <rect x="76" y="350" width="736" height="30" rx="10" fill="#DCE5F6" stroke="#0C1A3D" strokeWidth="3" />
      <rect x="78" y="365" width="732" height="13" rx="6" fill="url(#st-dots)" opacity="0.55" />
    </svg>
  );
}
