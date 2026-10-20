import Link from "next/link";
import { CalendarDays, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui";
import { Badge, VerifiedMentorBadge } from "@/components/badges";
import { PublicFooter, PublicNav } from "@/components/public-chrome";
import { AvailabilityMatch } from "@/components/availability-match";

const steps = [
  {
    title: "Search by subject and free hours",
    body: "Filter verified mentors by subject, year level, and day. By default you only see mentors whose free hours overlap yours.",
  },
  {
    title: "Send a partnership request",
    body: "The mentor accepts one-on-one, adds you to a study group for the same subject, or declines. You always see a notice before joining a group.",
  },
  {
    title: "Talk it through in Klasmeyt",
    body: "Each partnership and study group gets its own chat. Messages are saved and arrive live, so nobody has to swap numbers.",
  },
  {
    title: "Book a session inside your shared hours",
    body: "Either of you proposes a time you're both free, the other confirms, and the session shows up on both calendars with its Teams link.",
  },
];

const subjects = [
  { name: "Calculus 1", topics: "Limits, derivatives, and their applications" },
  { name: "Calculus 2", topics: "Integration techniques, sequences, and series" },
  { name: "Physics", topics: "Mechanics, work and energy, waves" },
];

const faqs = [
  {
    q: "Who can use Klasmeyt?",
    a: "Adamson University students. Mentees upload their COE and Student ID. Mentors upload their Student ID or COR, proof of the grades they're mentoring in, and a CV. An administrator verifies every account.",
  },
  {
    q: "Is it one-on-one or in groups?",
    a: "Both. A mentor can keep a private chat with you or invite you into a study group for the same subject. You always see a notice before joining a group.",
  },
  {
    q: "Who can see my documents?",
    a: "Only you and Klasmeyt administrators. The one exception is a mentor's CV, which verified mentees can open once that mentor is approved. Documents never appear on public profiles.",
  },
  {
    q: "Do sessions happen online or on campus?",
    a: "Scheduled sessions run on Microsoft Teams. Each mentor also lists how they prefer to meet, such as online or at the campus library, so you can agree on what works.",
  },
];

/** A verification checklist, written as the actual list of uploads. */
function Uploads({ who, items }: { who: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-[15px] font-semibold text-white">{who}</h3>
      <ul className="mt-3 space-y-2.5 text-[15px] text-brand-100">
        {items.map((it) => (
          <li key={it} className="flex gap-3">
            <span className="mt-[9px] h-px w-3 shrink-0 bg-pad-300" aria-hidden />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** What a search result looks like inside the app (Find a mentor), rendered with the app's own badges. */
function ExampleResult() {
  return (
    <figure className="rounded-panel border border-line bg-white">
      <figcaption className="flex items-center justify-between border-b border-line px-5 py-3 text-[13px] text-muted">
        <span>A result in Find a mentor</span>
        <span className="rounded-[4px] bg-paper px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ring-line">Example</span>
      </figcaption>
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-lg font-semibold text-brand-800">Dhennise B. Maala</p>
          <VerifiedMentorBadge />
        </div>
        <p className="mt-0.5 text-xs text-muted">4th Year, BS Civil Engineering. One-on-one or group.</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <span className="chip">Calculus 1</span>
          <span className="chip">Calculus 2</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink">
          <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5 text-muted" aria-hidden />Tue, Thu</span>
          <span className="flex items-center gap-1.5"><Clock className="size-3.5 text-muted" aria-hidden />1:00 – 5:00 PM</span>
          <Badge color="blue">Free when you are: Tue, Thu</Badge>
        </div>
        <div className="mt-5 flex gap-2" aria-hidden>
          <span className="inline-flex h-10 items-center rounded-control bg-brand-600 px-4 text-sm font-semibold text-white">Request partnership</span>
          <span className="inline-flex h-10 items-center rounded-control px-4 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-line">View profile</span>
        </div>
      </div>
    </figure>
  );
}

export default function Landing() {
  return (
    <div className="min-h-dvh bg-white">
      <PublicNav />

      <main id="main">
        {/* Hero: the promise, then the mechanic that delivers it */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20">
          <h1 className="display max-w-5xl text-[clamp(3.25rem,8.4vw,7rem)] text-brand-800">Study with a klasmeyt who already passed it.</h1>
          <div className="mt-8 flex flex-col gap-7 md:mt-10 md:flex-row md:items-end md:justify-between md:gap-14">
            <p className="max-w-xl text-[17px] leading-relaxed text-ink/80 md:text-lg">
              Klasmeyt matches Adamson students with upperclassmen who passed Calculus 1, Calculus 2, or Physics and are free when you are. Requests,
              chat, and sessions stay in one place.
            </p>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Button asChild size="lg"><Link href="/signup/mentee">Find a mentor</Link></Button>
              <Button asChild variant="secondary" size="lg"><Link href="/signup/mentor">Apply as a mentor</Link></Button>
            </div>
          </div>

          <div className="mt-14 md:mt-20">
            <AvailabilityMatch />
          </div>
        </section>

        {/* Verification: the reason to trust a stranger with your finals */}
        <section id="verified" className="scroll-mt-16 bg-brand-900 text-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.15fr] md:py-24">
            <div>
              <h2 className="display text-[clamp(2.5rem,5vw,3.75rem)]">A person checks every account.</h2>
              <p className="mt-5 max-w-md text-[17px] leading-relaxed text-brand-100">
                Nobody shows up in search on their word alone. An administrator opens each file, and a mentor appears in Find a mentor only after
                approval. If something's missing, the student is asked for more information instead of being let through.
              </p>
              <ol className="mt-8 flex flex-wrap items-center gap-x-1.5 gap-y-2 text-[13px]" aria-label="Account review stages">
                <li><Badge color="gray">Documents submitted</Badge></li>
                <li aria-hidden><ChevronRight className="size-4 text-brand-300" /></li>
                <li><Badge color="pad">In review</Badge></li>
                <li aria-hidden><ChevronRight className="size-4 text-brand-300" /></li>
                <li><Badge color="blue">Verified</Badge></li>
              </ol>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 md:pt-3">
              <Uploads who="Mentees send" items={["Certificate of Enrollment (COE)", "Student ID"]} />
              <Uploads who="Mentors send" items={["Student ID or COR", "Grades for each subject they mentor, from the grades portal or a TOR", "CV"]} />
              <p className="text-sm leading-relaxed text-brand-200 sm:col-span-2">
                Files stay private to you and the administrators. Verified mentees can open a mentor&rsquo;s CV once that mentor is approved.
              </p>
            </div>
          </div>
        </section>

        {/* How a match happens: a real sequence, next to what the result actually looks like */}
        <section id="about" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-16 sm:px-6 md:py-24">
          <h2 className="display max-w-xl text-[clamp(2.5rem,5vw,3.75rem)] text-brand-800">From request to review session.</h2>
          <div className="mt-12 grid gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16">
            <ol className="ml-[13px] border-l border-line">
              {steps.map((s, i) => (
                <li key={s.title} className="relative pb-9 pl-8 last:pb-0">
                  <span className="num absolute -left-[13px] top-0 grid size-[26px] place-items-center rounded-full bg-white text-[13px] font-semibold text-brand-700 ring-1 ring-brand-200" aria-hidden>
                    {i + 1}
                  </span>
                  <h3 className="pt-0.5 font-semibold text-brand-800">{s.title}</h3>
                  <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
            <div className="md:pt-1">
              <ExampleResult />
            </div>
          </div>
        </section>

        {/* Subjects: a short list, not a row of cards */}
        <section id="courses" className="scroll-mt-16 border-t border-line">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.6fr] md:py-20">
            <h2 className="display text-[clamp(2.5rem,5vw,3.75rem)] text-brand-800">Subjects</h2>
            <dl className="divide-y divide-line border-y border-line">
              {subjects.map((s) => (
                <div key={s.name} className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="text-lg font-semibold text-brand-800">{s.name}</dt>
                  <dd className="text-[15px] text-muted sm:pt-0.5">{s.topics}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section id="faqs" className="scroll-mt-16 bg-paper">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1fr_1.6fr] md:py-20">
            <h2 className="display text-[clamp(2.5rem,5vw,3.75rem)] text-brand-800">Questions students ask</h2>
            <div className="divide-y divide-line border-y border-line">
              {faqs.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-control text-[17px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="text-xl leading-none text-brand-500 transition-transform duration-200 ease-out group-open:rotate-45" aria-hidden>+</span>
                  </summary>
                  <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
          <div className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 md:pb-20">
            <div className="flex flex-col gap-5 border-t border-line pt-10 md:flex-row md:items-center md:justify-between">
              <p className="text-[17px] text-ink">Taking one of these this sem? Sign up with your Adamson email.</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg"><Link href="/signup/mentee">Find a mentor</Link></Button>
                <Button asChild variant="secondary" size="lg"><Link href="/signup/mentor">Apply as a mentor</Link></Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
