"use client";

import Link from "next/link";
import { useState } from "react";
import { MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button, Field } from "@/components/ui";

export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter the email you registered with.");
    setBusy(true);
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    setBusy(false);
    // Same message whether or not the account exists, so this page can't be used to discover emails.
    if (error && /rate limit/i.test(error.message)) return setError("Too many requests. Wait a few minutes and try again.");
    setSent(true);
  }

  return (
    <div className="flex min-h-dvh flex-col bg-white px-4 py-8 sm:px-10">
      <Link href="/" className="w-fit rounded-control"><Logo /></Link>
      <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600"><MailCheck className="size-6" aria-hidden /></span>
            <h1 className="mt-4 text-2xl font-semibold text-brand-800">Check your email</h1>
            <p className="mt-2 text-sm text-muted">If an account uses that email, a link to set a new password is on its way. It expires in 1 hour.</p>
            <Button asChild variant="secondary" className="mt-6"><Link href="/login">Back to log in</Link></Button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-brand-800">Reset your password</h1>
            <p className="mt-1 text-sm text-muted">We&rsquo;ll email you a link to set a new one.</p>
            <div className="mt-6 space-y-4">
              <Field label="Email" htmlFor="email">
                <input id="email" name="email" type="email" inputMode="email" autoComplete="username" spellCheck={false} required className="field" />
              </Field>
              <p aria-live="polite" className={error ? "text-sm text-red-700" : "sr-only"}>{error}</p>
              <Button type="submit" className="w-full" size="lg" loading={busy}>Send reset link</Button>
              <p className="text-center text-sm text-muted"><Link href="/login" className="font-medium text-brand-700 underline underline-offset-4">Back to log in</Link></p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
