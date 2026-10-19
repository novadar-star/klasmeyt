import { PublicFooter, PublicNav } from "@/components/public-chrome";
import { SignupWizard } from "@/components/signup-wizard";

export const metadata = { title: "Mentor application" };

export default function Page() {
  return (
    <div className="min-h-dvh bg-paper">
      <PublicNav />
      <main id="main" className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <SignupWizard role="mentor" />
      </main>
      <PublicFooter />
    </div>
  );
}
