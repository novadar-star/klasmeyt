"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button, Field } from "@/components/ui";
import { MatchIllustration } from "@/components/match-illustration";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") === "link" ? "That link is invalid or has expired. Log in, or request a new link." : null);
  const [busy, setBusy] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function resend() {
    if (!unconfirmed) return;
    const { error } = await createClient().auth.resend({
      type: "signup",
      email: unconfirmed,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/status` },
    });
    setResent(true);
    if (error && /rate limit/i.test(error.message)) setError("Too many requests. Wait a few minutes before resending.");
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setBusy(false);
      if (error && /not confirmed/i.test(error.message)) {
        setUnconfirmed(email);
        setResent(false);
        setError("Confirm your email first. Open the link we sent when you signed up.");
        return;
      }
      setError(
        error?.message === "Invalid login credentials" ? "That email and password don't match an account. Check for typos, or sign up if you're new."
        : error && /rate limit|too many/i.test(error.message) ? "Too many attempts. Wait a few minutes and try again."
        : "Couldn't log in. Try again in a moment."
      );
      (document.getElementById("password") as HTMLInputElement | null)?.focus();
      return;
    }
    const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const raw = params.get("next");
    const next = raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("\\") && raw !== "/" ? raw : null; // same-site only
    router.push(next ?? (p?.role === "admin" ? "/admin" : "/dashboard"));
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <h1 className="display text-[44px] text-brand-800">Log in</h1>
      <p className="mt-3 text-sm text-muted">Use the email you registered with. Mentees, mentors, and administrators all log in here.</p>

      <div className="mt-7 space-y-4">
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" inputMode="email" autoComplete="username" spellCheck={false} required className="field" placeholder="juan.delacruz@adamson.edu.ph" />
        </Field>
        <div>
          <div className="mb-1.5 flex items-baseline justify-between">
            <label className="label mb-0" htmlFor="password">Password</label>
            {/* Password reset needs an email sender, which the SRS leaves out (v1). Admins reset passwords from Supabase.
                Set NEXT_PUBLIC_EMAIL_ENABLED=true once custom SMTP is configured to show the link. */}
            {process.env.NEXT_PUBLIC_EMAIL_ENABLED === "true" ? (
              <Link href="/forgot-password" className="text-[13px] text-brand-700 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-600">Forgot password?</Link>
            ) : (
              <span className="text-[13px] text-muted">Forgot it? Ask an administrator.</span>
            )}
          </div>
          <div className="relative">
            <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="field pr-10" />
            <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-control text-muted transition-colors duration-150 hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </div>
        <div aria-live="polite" className={cn("text-sm text-red-700", !error && "sr-only")}>
          {error}
          {unconfirmed ? (
            resent ? <p className="mt-1 text-ink">Sent. Check your inbox and spam folder.</p>
            : <button type="button" onClick={resend} className="mt-1 block font-medium text-brand-700 underline underline-offset-4">Resend confirmation email</button>
          ) : null}
        </div>
        <Button type="submit" className="w-full" size="lg" loading={busy}>Log in</Button>
        <p className="text-center text-sm text-muted">
          New to Klasmeyt? <Link href="/signup" className="font-medium text-brand-700 underline decoration-brand-200 underline-offset-4 hover:decoration-brand-600">Create an account</Link>
        </p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col bg-white px-4 py-8 sm:px-10">
        <Link href="/" className="w-fit rounded-control"><Logo /></Link>
        <main id="main" className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Suspense><LoginForm /></Suspense>
        </main>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden border-l border-line bg-brand-50 p-12 lg:flex xl:p-16">
        <MatchIllustration className="h-auto w-full max-w-[580px] select-none" />
      </div>
    </div>
  );
}
