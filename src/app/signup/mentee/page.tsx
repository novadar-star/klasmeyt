import { PublicFooter, PublicNav } from "@/components/public-chrome";
import { SignupWizard } from "@/components/signup-wizard";

export const metadata = { title: "Mentee registration" };

export default function Page() {
  return (
    <div className="min-h-dvh bg-paper">
      <PublicNav />
      <div className="h-1 bg-teal-600/80" />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <SignupWizard role="mentee" />
      </main>
      <PublicFooter />
    </div>
  );
}
