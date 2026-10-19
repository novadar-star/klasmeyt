import Link from "next/link";
import { Award, UserRound } from "lucide-react";
import { Button } from "@/components/ui";
import { PublicFooter, PublicNav } from "@/components/public-chrome";

export const metadata = { title: "Sign up" };

export default function SignupChooser() {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <PublicNav />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6">
        <p className="text-center text-xs font-semibold text-brand-600">Getting started</p>
        <h1 className="mt-2 text-center text-3xl font-semibold tracking-[-0.015em] text-brand-800">How would you like to use Klasmeyt?</h1>
        <p className="mx-auto mt-2 max-w-lg text-center text-sm text-muted">Choose your profile type. Mentee and mentor accounts are separate.</p>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-panel border border-line bg-white p-7">
            <span className="grid size-11 place-items-center rounded-control bg-brand-50 text-brand-700"><UserRound className="size-5" /></span>
            <h2 className="mt-5 text-lg font-semibold text-brand-800">Student Mentee</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">Get help in Calculus 1, Calculus 2, or Physics from verified Adamson mentors who already passed the subject.</p>
            <Button asChild className="mt-6 w-full"><Link href="/signup/mentee">Sign up as mentee</Link></Button>
          </div>
          <div className="flex flex-col rounded-panel border border-line bg-white p-7">
            <span className="grid size-11 place-items-center rounded-control bg-pad-50 text-pad-800"><Award className="size-5" /></span>
            <h2 className="mt-5 text-lg font-semibold text-brand-800">Verified Mentor</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">Teach underclassmen in subjects you've completed. Run one-on-one or group sessions and share what worked for you.</p>
            <Button asChild variant="primary" className="mt-6 w-full"><Link href="/signup/mentor">Apply as mentor</Link></Button>
          </div>
        </div>
        <p className="mt-8 text-center text-sm text-muted">Already have an account? <Link href="/login" className="font-semibold text-brand-700 hover:underline">Log in</Link></p>
      </main>
      <PublicFooter />
    </div>
  );
}
