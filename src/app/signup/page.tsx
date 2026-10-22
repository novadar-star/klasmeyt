import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PublicFooter, PublicNav } from "@/components/public-chrome";

export const metadata = { title: "Sign up" };

/**
 * Two ways in. Each option says what it's for and what you'll need to upload, so nobody
 * starts a form they can't finish. The whole row is the link.
 */
const options = [
  {
    href: "/signup/mentee",
    title: "I need help in a subject",
    action: "Sign up as a mentee",
    body: "Get matched with a verified upperclassman who passed Calculus 1, Calculus 2, or Physics and is free when you are.",
    needs: "Your COE and Student ID",
  },
  {
    href: "/signup/mentor",
    title: "I passed a subject and can teach it",
    action: "Apply as a mentor",
    body: "Help underclassmen one-on-one or in a study group. You appear in search once an administrator approves your application.",
    needs: "Your Student ID or COR, your grades for the subject, and a CV",
  },
];

export default function SignupChooser() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <PublicNav />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-14 sm:px-6 md:py-20">
        <h1 className="display text-[clamp(2.75rem,6vw,4.25rem)] text-brand-800">Create your account</h1>
        <p className="mt-4 max-w-lg text-[17px] text-muted">Mentee and mentor accounts are separate. Use your Adamson email for either one.</p>

        <ul className="mt-10 divide-y divide-line border-y border-line">
          {options.map((o) => (
            <li key={o.href}>
              <Link
                href={o.href}
                className="press group -mx-4 grid gap-3 rounded-control px-4 py-7 hover:bg-paper active:scale-[0.99] sm:grid-cols-[1fr_auto] sm:items-center sm:gap-10"
              >
                <span>
                  <span className="block text-xl font-semibold text-brand-800">{o.title}</span>
                  <span className="mt-1.5 block max-w-xl text-[15px] leading-relaxed text-muted">{o.body}</span>
                  <span className="mt-3 block text-sm text-ink">
                    <span className="text-muted">You&rsquo;ll need: </span>
                    {o.needs}
                  </span>
                </span>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-brand-700">
                  {o.action}
                  <ArrowRight className="size-4 transition-transform duration-150 ease-out group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-sm text-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-600">Log in</Link>
        </p>
      </main>
      <PublicFooter />
    </div>
  );
}
