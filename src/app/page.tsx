import Link from "next/link";
import { BadgeCheck, CalendarCheck, MessagesSquare, UserSearch } from "lucide-react";
import { Button } from "@/components/ui";
import { PublicFooter, PublicNav } from "@/components/public-chrome";
import { AvailabilityMatch } from "@/components/availability-match";

const steps = [
  { icon: UserSearch, title: "Find a mentor who passed it", body: "Search verified upperclassmen by subject, year level, and the hours you're both free." },
  { icon: BadgeCheck, title: "Every mentor is checked", body: "Mentors submit their grades and CV. An administrator approves them before they show up in search." },
  { icon: MessagesSquare, title: "Chat that stays put", body: "Each partnership or study group gets its own chat. Messages are saved and arrive live." },
  { icon: CalendarCheck, title: "Sessions on Teams", body: "Propose a time inside your shared free hours, confirm it together, and join from your calendar." },
];

const faqs = [
  { q: "Who can use Klasmeyt?", a: "Adamson University students. Mentees upload their COE and Student ID; mentors also submit an academic record and CV. An administrator verifies every account." },
  { q: "What subjects are offered?", a: "Calculus 1, Calculus 2, and Physics." },
  { q: "Is it one-on-one or in groups?", a: "Both. A mentor can keep a private chat with you or invite you into a study group for the same subject. You always see a notice before joining a group." },
  { q: "Who can see my documents?", a: "Only you and Klasmeyt administrators. Documents never appear on public profiles." },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-white">
      <PublicNav />

      <section id="main" className="overflow-hidden bg-brand-900 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-14 sm:px-6 md:grid-cols-[1fr_1.05fr] md:pb-24 md:pt-20">
          <div>
            <p className="text-sm font-medium text-pad-200">Peer mentoring for Adamson Falcons</p>
            <h1 className="mt-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] sm:text-[52px]">
              Study with a klasmeyt who already passed it.
            </h1>
            <p className="mt-5 max-w-md text-[17px] leading-relaxed text-brand-100">
              Klasmeyt pairs you with verified Adamson mentors for Calculus 1, Calculus 2, and Physics, then keeps your chat and sessions in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="on-dark" size="lg"><Link href="/signup/mentee">Find a mentor</Link></Button>
              <Button asChild variant="outline-on-dark" size="lg"><Link href="/signup/mentor">Apply as a mentor</Link></Button>
            </div>
            <p className="mt-6 text-sm text-brand-200">
              Already registered? <Link href="/login" className="font-medium text-white underline decoration-white/40 underline-offset-4 hover:decoration-white">Log in</Link>
            </p>
          </div>
          <div className="relative mx-auto w-full max-w-[460px]">
            <AvailabilityMatch />
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-[30px] font-semibold leading-tight tracking-[-0.015em] text-brand-800">How it works</h2>
            <p className="mt-3 max-w-sm text-muted">
              From the first request to the Teams link, everything happens inside Klasmeyt. You never have to swap numbers to schedule a review.
            </p>
          </div>
          <ol className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {steps.map((s, i) => (
              <li key={s.title} className="relative pl-12">
                <span className="num absolute left-0 top-0 grid size-8 place-items-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="font-semibold text-brand-800">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="courses" className="scroll-mt-20 border-y border-line bg-paper">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold text-brand-800">Subjects you can get help with</h2>
          <ul className="flex flex-wrap gap-3">
            {[["Calculus 1", "Limits & derivatives"], ["Calculus 2", "Integration & series"], ["Physics", "Mechanics & waves"]].map(([s, d]) => (
              <li key={s} className="rounded-panel border border-line bg-white px-5 py-3">
                <p className="font-semibold text-brand-800">{s}</p>
                <p className="text-xs text-muted">{d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="faqs" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-20 sm:px-6">
        <h2 className="text-[30px] font-semibold tracking-[-0.015em] text-brand-800">Questions students ask</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-control font-medium text-ink [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-xl leading-none text-brand-500 transition-transform duration-200 ease-out group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
