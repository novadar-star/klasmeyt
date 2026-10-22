"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button, Field } from "@/components/ui";
import { passwordProblem } from "@/lib/password";
import { toast } from "sonner";

/** Reached from the reset email (the callback route signs the user in with a recovery session first). */
export default function ResetPassword() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const pw = String(fd.get("password") ?? "");
    const pw2 = String(fd.get("confirm") ?? "");
    const problem = passwordProblem(pw);
    if (problem) return setError(problem);
    if (pw !== pw2) return setError("The passwords don't match.");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(/session/i.test(error.message) ? "This reset link has expired. Request a new one." : error.message);
    await supabase.auth.signOut({ scope: "others" }); // end sessions on other devices
    toast.success("Password updated");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white px-4 py-8 sm:px-10">
      <Link href="/" className="w-fit rounded-control"><Logo /></Link>
      <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        <form onSubmit={submit} noValidate>
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-brand-800">Set a new password</h1>
          <p className="mt-1 text-sm text-muted">You&rsquo;ll stay logged in on this device. Other devices are logged out.</p>
          <div className="mt-6 space-y-4">
            <Field label="New password" htmlFor="password" hint="At least 8 characters, with letters and numbers.">
              <input id="password" name="password" type="password" autoComplete="new-password" required className="field" />
            </Field>
            <Field label="Confirm new password" htmlFor="confirm">
              <input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field" />
            </Field>
            <p aria-live="polite" className={error ? "text-sm text-red-700" : "sr-only"}>
              {error} {error?.includes("expired") ? <Link href="/forgot-password" className="underline">Request a new link</Link> : null}
            </p>
            <Button type="submit" className="w-full" size="lg" loading={busy}>Save new password</Button>
          </div>
        </form>
      </main>
    </div>
  );
}
