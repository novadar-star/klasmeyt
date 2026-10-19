import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/"><Logo /></Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-ink md:flex">
          <Link href="/" className="hover:text-teal-700">Home</Link>
          <Link href="/#about" className="hover:text-teal-700">About Peer Mentoring</Link>
          <Link href="/#courses" className="hover:text-teal-700">Supported Courses</Link>
          <Link href="/#faqs" className="hover:text-teal-700">FAQs</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm"><Link href="/login">Log in</Link></Button>
          <Button asChild size="sm"><Link href="/signup">Sign up</Link></Button>
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-brand-700 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-100">
            Klasmeyt is the peer mentoring and study buddy platform for Adamson University students. Empowering Falcons through shared knowledge and academic excellence.
          </p>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-400">Who can join</p>
          <ul className="mt-3 space-y-2 text-sm font-medium">
            <li>Adamson University students</li>
            <li>Verified peer mentors</li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-amber-400">Supported subjects</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>• Calculus 1</li>
            <li>• Calculus 2</li>
            <li>• Physics</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-5 text-xs text-brand-200 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Klasmeyt Adamson. Built for Falcons.</p>
          <p>Republic Act No. 10173 Compliant</p>
        </div>
      </div>
    </footer>
  );
}
