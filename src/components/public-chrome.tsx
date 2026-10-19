import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Site">
        <Link href="/" className="rounded-control"><Logo /></Link>
        <div className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#about" className="transition-colors duration-150 hover:text-ink">How it works</Link>
          <Link href="/#courses" className="transition-colors duration-150 hover:text-ink">Subjects</Link>
          <Link href="/#faqs" className="transition-colors duration-150 hover:text-ink">FAQs</Link>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="quiet" size="sm"><Link href="/login">Log in</Link></Button>
          <Button asChild size="sm"><Link href="/signup">Sign up</Link></Button>
        </div>
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-brand-200">
            Peer mentoring and study partners for Adamson University students.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Who can join</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-200">
            <li>Adamson University students</li>
            <li>Mentors approved by an administrator</li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Subjects</p>
          <ul className="mt-3 space-y-2 text-sm text-brand-200">
            <li>Calculus 1</li>
            <li>Calculus 2</li>
            <li>Physics</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-5 text-xs text-brand-300 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Klasmeyt, Adamson University</p>
          <p>Handles personal data under Republic Act No. 10173</p>
        </div>
      </div>
    </footer>
  );
}
