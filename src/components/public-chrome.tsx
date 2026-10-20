import Link from "next/link";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui";

export function PublicNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6" aria-label="Site">
        <Link href="/" className="rounded-control"><Logo /></Link>
        <div className="hidden items-center gap-7 text-sm text-muted md:flex">
          <Link href="/#verified" className="transition-colors duration-150 hover:text-ink">Verification</Link>
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
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <Logo light />
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-brand-200">
          <Link href="/login" className="transition-colors duration-150 hover:text-white">Log in</Link>
          <Link href="/signup/mentee" className="transition-colors duration-150 hover:text-white">Find a mentor</Link>
          <Link href="/signup/mentor" className="transition-colors duration-150 hover:text-white">Apply as a mentor</Link>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-4 py-5 text-xs text-brand-300 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Klasmeyt. For Adamson University students.</p>
          <p>Handles personal data under the Data Privacy Act of 2012 (Republic Act No. 10173)</p>
        </div>
      </div>
    </footer>
  );
}
