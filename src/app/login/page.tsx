"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button, Field } from "@/components/ui";
import { YellowPad } from "@/components/yellow-pad";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"mentee" | "mentor">("mentee");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
      setError(error?.message === "Invalid login credentials" ? "That email and password don't match an account. Check for typos, or sign up if you're new." : error?.message ?? "Couldn't log in. Try again in a moment.");
      (document.getElementById("password") as HTMLInputElement | null)?.focus();
      return;
    }
    const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const next = params.get("next");
    router.push(next && next !== "/" ? next : p?.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full" noValidate>
      <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-brand-800">Log in to Klasmeyt</h1>
      <p className="mt-1 text-sm text-muted">Use the email you registered with.</p>

      {/* Segmented control: the indicator slides (200ms ease-in-out) instead of the colors swapping. */}
      <div className="relative mt-6 grid grid-cols-2 rounded-control bg-paper p-1 ring-1 ring-inset ring-line" role="tablist" aria-label="Account type">
        <span
          data-motion="transform"
          className={cn("absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-[6px] bg-white shadow-[0_1px_2px_rgba(12,26,61,0.12)] transition-transform duration-200 ease-in-out", tab === "mentor" && "translate-x-full")}
          aria-hidden
        />
        {(["mentee", "mentor"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("relative z-10 rounded-[6px] py-2 text-sm font-medium transition-colors duration-150", tab === t ? "text-brand-800" : "text-muted hover:text-ink")}
          >
            {t === "mentee" ? "Student mentee" : "Verified mentor"}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Email" htmlFor="email">
          <input id="email" name="email" type="email" inputMode="email" autoComplete="username" spellCheck={false} required className="field" placeholder="juan.delacruz@adamson.edu.ph" />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" required className="field pr-10" />
            <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-control text-muted transition-colors duration-150 hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </Field>
        <p aria-live="polite" className={cn("text-sm text-red-700", !error && "sr-only")}>{error}</p>
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
      <div className="relative hidden place-items-center overflow-hidden bg-brand-900 p-12 lg:grid">
        <div className="w-full max-w-[480px] -rotate-[1.5deg]">
          <YellowPad />
        </div>
        <p className="absolute bottom-10 left-12 right-12 text-sm text-brand-200">
          Mentors write it out with you, step by step. <span className="text-white">Calculus 1, Calculus 2, and Physics.</span>
        </p>
      </div>
    </div>
  );
}
