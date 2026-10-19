import Image from "next/image";
import Link from "next/link";
import { Award, CalendarDays, Layers, MonitorPlay, UserSearch } from "lucide-react";
import { Button } from "@/components/ui";
import { PublicFooter, PublicNav } from "@/components/public-chrome";
import { cn } from "@/lib/utils";

const features = [
  { icon: UserSearch, tint: "bg-teal-50 text-teal-700", title: "Find a Mentor", body: "Browse verified upperclassmen who have successfully completed Calculus 1, Calculus 2, or Physics." },
  { icon: Award, tint: "bg-amber-50 text-amber-600", title: "Become a Mentor", body: "Share what you've mastered, support your Falcon community, and build your academic portfolio." },
  { icon: Layers, tint: "bg-brand-50 text-brand-600", title: "Subject-Based Matching", body: "Filtering by subject, year level, and availability pairs you with mentors whose schedule fits yours." },
  { icon: CalendarDays, tint: "bg-red-50 text-red-500", title: "Schedule Sessions", body: "Propose a session inside your shared free time and confirm it together. It lands on both calendars." },
  { icon: MonitorPlay, tint: "bg-violet-50 text-violet-600", title: "Meet Online", body: "Chat with your mentor or study group anytime, then join sessions through the mentor's Microsoft Teams link." },
];

const faqs = [
  { q: "Who can use Klasmeyt?", a: "Adamson University students. Mentees upload their COE and Student ID; mentors also submit an academic record and CV. An administrator verifies every account." },
  { q: "What subjects are offered?", a: "Calculus 1, Calculus 2, and Physics." },
  { q: "Is it one-on-one or group?", a: "Both. A mentor can keep a private chat with you or invite you into a study group for the same subject. You always see a notice before joining a group." },
  { q: "Who sees my documents?", a: "Only you and Klasmeyt administrators. Documents never appear on public profiles." },
];

export default function Landing() {
  return (
    <div className="min-h-dvh bg-white">
      <PublicNav />

      <section className="bg-brand-700 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:grid-cols-[1.2fr_1fr] md:py-24">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 ring-1 ring-inset ring-amber-500/30">
              <span className="size-1.5 rounded-full bg-amber-400" /> Adamson University Falcons
            </span>
            <h1 className="mt-5 text-5xl font-extrabold tracking-tight sm:text-6xl">KLASMEYT</h1>
            <p className="mt-3 text-xl font-semibold text-amber-400">Peer Mentoring and Study Buddy Platform</p>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-brand-100">
              A peer learning space for Adamson University students. Get through Calculus 1, Calculus 2, and Physics alongside verified Falcon mentors who already passed them.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="orange" size="lg"><Link href="/signup">Sign up as student</Link></Button>
              <Button asChild variant="outline-light" size="lg"><Link href="/login">Log in to portal</Link></Button>
            </div>
          </div>
          <div className="mx-auto grid aspect-square w-full max-w-sm place-items-center rounded-3xl bg-brand-800 ring-1 ring-white/10">
            <Image src="/logo-coin.png" alt="Klasmeyt emblem" width={300} height={300} className="w-3/4 rounded-full shadow-[0_0_60px_rgba(19,154,160,0.35)]" priority />
          </div>
        </div>
      </section>

      <section id="about" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
        <p className="text-center text-[11px] font-bold uppercase tracking-wider text-teal-600">Platform features</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-brand-700">Built for the subjects that trip Falcons up</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {features.map((f, i) => (
            <div key={f.title} className={cn("rounded-xl border border-line p-6", i < 3 ? "lg:col-span-2" : "lg:col-span-3")}>
              <span className={cn("grid size-10 place-items-center rounded-lg", f.tint)}>
                <f.icon className="size-5" />
              </span>
              <h3 className="mt-5 font-bold text-brand-700">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="courses" className="scroll-mt-20 bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-center text-[11px] font-bold uppercase tracking-wider text-teal-600">Supported courses</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {["Calculus 1", "Calculus 2", "Physics"].map((s) => (
              <span key={s} className="rounded-lg border border-teal-300 bg-white px-5 py-3 text-sm font-bold text-teal-700">{s}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="faqs" className="mx-auto max-w-3xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold text-brand-700">FAQs</h2>
        <div className="mt-8 divide-y divide-line rounded-xl border border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group px-5 py-4">
              <summary className="cursor-pointer list-none font-semibold text-ink marker:hidden">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
