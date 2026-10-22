# Klasmeyt design guidelines

These are the rules the UI is built on. When you add a screen, follow them. When a rule gets in the way, change the rule here first, then change the code.

Sources: Anthropic's *frontend-design* skill (point of view, type, anti-template rules), Emil Kowalski's *emil-design-eng* (motion and component feel), and Vercel's *Web Interface Guidelines* (accessibility, forms, content).

## 1. Point of view

Klasmeyt is a study tool for Adamson students, not a SaaS dashboard. Its visual identity comes from two real things:

- **Adamson blue and white.** The SRS requires it, and students recognize it immediately.
- **Illustrations, one drawing system.** The landing hero (a mentee asking, a mentor answering at one table), the partner cards in "From request to review session", and the login panel ("Matched schedule") are hand-built SVGs in `src/components/*-illustration.tsx`. Rules: brand tokens only; navy (`brand-900`) silhouettes without faces; `brand-600` shirts with halftone dots; 3px navy outlines; solid `brand-700` offset shadows instead of blurred ones; round-capped motion marks used sparingly. Role colors carry meaning: mentee = yellow (`pad`), mentor = light blue (`brand-100`), a match or accepted partnership = solid blue with a white check. Never green (reserved for Verified), never AI-generated raster art. Live text in an illustration uses the `.display` face.
- **Verification shown, not asserted.** The landing page lists the actual uploads each role sends and the real review stages (Documents submitted, In review, Verified). Trust comes from specifics, not a badge.

Everything else stays quiet so those read clearly. No floating cards, icon tiles, or rows of identical cards on public pages; use lists, rules, and the app's own components.

## 2. Color

| Token | Hex | Use |
|---|---|---|
| `brand-600` | `#1D4196` | Primary actions, links, active states (Adamson royal blue) |
| `brand-700` | `#173478` | Hover on primary, link text |
| `brand-800` | `#13295C` | Headings |
| `brand-900` | `#0C1A3D` | Sidebar, hero, footer |
| `brand-50/100/200` | | Selected rows, chips, subtle rings |
| `pad-100/300` | `#FFF3C4` / `#F4D65F` | Warm accent. **Waiting states** (pending, invites, unread count) and the mentee's side of a schedule |
| `ink` | `#111A2E` | Body text |
| `muted` | `#5D6880` | Secondary text |
| `line` | `#E2E7EF` | Borders and dividers |
| `paper` | `#F6F8FB` | App background |
| `red-*` | Tailwind | Errors and destructive actions only |

Status color is meaning, not decoration:

- **Green** means a person passed verification: Verified, Approved. It's the only green in the app, so an approved account is obvious at a glance.
- **Blue** means an arrangement is in place: Scheduled, Confirmed, Accepted.
- **Yellow (pad)** means waiting on someone: Needs review, In review, Pending, Group invite.
- **Red** means it needs action or failed: Needs more info, Rejected, Declined.
- **Gray** means inactive: Cancelled, Completed, Left.

Don't introduce other hues (no teal, purple, or orange). If something needs to stand out, use weight, size, or position first.

## 3. Type

- **Instrument Sans Variable** for everything (self-hosted via `@fontsource-variable/instrument-sans`, width axis included). One family, no decorative fonts.
- **Display headings** use the `.display` class: the same family at 76% width, weight 700, tight leading. It's the brand's voice: landing and auth headlines (40–112px) and app page titles (34px). Body and UI text stay at normal width.
- Scale: page title 34px display, section title 15px semibold, body 14px (15–17px on public pages), small 12–13px.
- Headings use slight negative tracking (`-0.01em` to `-0.025em` for display). Never letter-space body text.
- **Sentence case everywhere**, including buttons and labels. No ALL-CAPS eyebrows or labels.
- Numbers that get compared (stats, counts, tables) use the `num` class for tabular figures.
- Use `…` not `...`. Loading labels end with `…`. Use `&nbsp;` in "10&nbsp;MB".

## 4. Shape and layout

- Two radii: `rounded-control` (8px) for buttons, inputs, chips; `rounded-panel` (12px) for cards and panels. Badges are pills.
- Cards are a white surface with a 1px `line` border. No drop shadows, except modals and the hero schedule card.
- Not everything is a card. Lists inside a card use dividers; pages use the white title band (`PageHeader`) plus content.
- Labels above values use `.eyebrow` (12px, muted, sentence case).
- Mobile first: every page works at 390px with a 16px gutter and no horizontal scroll.

## 5. Motion (Emil Kowalski's rules)

Before animating, ask how often the user sees it.

| Frequency | Rule | In Klasmeyt |
|---|---|---|
| Dozens of times a day | No animation, just a fast color change | Sidebar nav, list rows |
| Occasional | Short, purposeful | Modals, drawer, tabs, new chat messages, toasts |
| Once | Can delight | Landing hero: the mentee's question bubble settles in, then the mentor's reply (`.pop-in`, 340ms, staggered) |

Easing tokens (`globals.css` / Tailwind):

- `--ease-out` `cubic-bezier(0.23, 1, 0.32, 1)` for anything entering or responding to a press.
- `--ease-in-out` `cubic-bezier(0.77, 0, 0.175, 1)` for things moving on screen (tab indicator).
- `--ease-drawer` `cubic-bezier(0.32, 0.72, 0, 1)` for the mobile drawer.
- Never `ease-in` for UI. Never `transition: all`; list the properties.

Patterns in use:

- **Press feedback:** every button and pressable scales to `0.97` on `:active`, 150ms ease-out.
- **Loading buttons:** the label blurs out (2px) and a spinner fades in. No layout jump (`Button loading`).
- **Modals:** enter from `scale(0.96)` plus fade in 220ms; exit faster, 150ms. Centered, never origin-aware.
- **Mobile drawer:** always mounted, slides with the drawer curve in 300ms, leaves in 200ms; `inert` when closed.
- **Checkbox cards:** the check mark goes from `scale(0.9)`/opacity 0 to full. Never from `scale(0)`.
- **Chat:** only messages that arrive after the page loads ease in (6px rise plus fade, 180ms, `@starting-style`).
- **Pressables that aren't `<Button>`** use `.press` (150ms ease-out, scale 0.97). Large tiles and rows add `active:scale-[0.98]`/`[0.99]` so big surfaces barely move.
- **Icon-only controls** use `.press icon-btn`: scale 0.92 on press plus an invisible hit area that grows any icon to 44×44px.
- **Small text links** (Edit, View all, Chat) use `.hit`: a larger invisible tap area with no layout change.
- **Touch sizes:** on touch screens (`pointer: coarse`) buttons grow (sm 40px, md 44px, lg 48px), sidebar rows get taller, and filter chips are 36px on phones.
- **SVG parts** that animate set `transform-box: fill-box` so they scale from their own anchor (bubble tails), not the canvas corner.
- Hover styles only apply on devices that can hover (`future.hoverOnlyWhenSupported`).
- Everything UI-related stays under 300ms.

**Reduced motion:** movement is removed, opacity stays. Transitions fall back to color and opacity only, modals fade, illustration parts only fade, and presses dim (opacity 0.8) instead of scaling.

## 6. Components and voice

- One primary button per view. Secondary actions use `secondary` (outlined) or `quiet` (text).
- Button labels say what happens: "Send request", "Accept request", "Cancel session". The confirmation uses the same verb.
- **Destructive actions always confirm** (`ConfirmButton`): decline request, withdraw, cancel session, reject. The confirm dialog's safe option is "Keep it".
- Errors say what went wrong and how to fix it, in the interface's voice. They don't apologize.
- Empty states tell you the next step and usually offer the button for it.
- Name things the way students say them: "My study partners", "Next session", "Your weekly availability". Avoid system jargon ("Curriculum alignment", "Dossier", "Logistics").

## 7. Accessibility and forms checklist

- [x] Skip link to `#main` on every page
- [x] Visible `:focus-visible` ring (2px `brand-500`); never remove an outline without a replacement
- [x] Icon-only buttons have `aria-label`; decorative icons are `aria-hidden`
- [x] Inputs have labels, `name`, `autocomplete`; emails use `type="email"`, `inputMode="email"`, `spellCheck={false}`
- [x] Checkbox cards use real (visually hidden) checkboxes in one `<label>` hit area
- [x] Async messages (login errors) are `aria-live="polite"`; toasts come from Sonner
- [x] `touch-action: manipulation`, intentional tap highlight, `overscroll-behavior: contain` on modals and drawer
- [x] Headings `text-wrap: balance`; long text truncates or wraps (`min-w-0`, `truncate`, `break-words`)
- [x] Filters and tabs live in the URL (Find a Mentor, admin lists, calendar month)
- [x] Dates and times use `Intl.DateTimeFormat` in Asia/Manila, 12-hour

## 8. Open items

- Logo: the official file is `public/logo.png` (transparent circle); favicon and app icons are generated from it in `src/app/`.
- The login page has no mentee/mentor toggle. It never changed anything (the role comes from the account), so it was removed.
- Copy inside the app still has a few Figma-era labels that break the voice rules ("Course alignment", "Courses focus", Title Case page titles). Change them once the client agrees.
- The colors move away from the client's Figma (teal and orange). Layouts and screens still follow it. Get the client's sign-off on the palette.
