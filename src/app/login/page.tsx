"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/logo";
import { Button, Field } from "@/components/ui";
import { cn } from "@/lib/utils";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"mentee" | "mentor">("mentee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    if (error || !data.user) {
      setBusy(false);
      setError(error?.message === "Invalid login credentials" ? "That email and password don't match an account." : error?.message ?? "Couldn't log in.");
      return;
    }
    const { data: p } = await supabase.from("profiles").select("role").eq("id", data.user.id).single();
    const next = params.get("next");
    router.push(next && next !== "/" ? next : p?.role === "admin" ? "/admin" : "/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-line bg-white p-6 shadow-sm sm:p-7">
      <h1 className="text-xl font-bold text-brand-700">Sign In to Klasmeyt</h1>
      <p className="mt-1 text-sm text-muted">Use your registered institutional credentials</p>
      <div className="mt-5 grid grid-cols-2 rounded-lg bg-paper p-1 ring-1 ring-inset ring-line" role="tablist">
        {(["mentee", "mentor"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("rounded-md py-2 text-[11px] font-bold uppercase tracking-wide", tab === t ? "bg-white text-brand-700 shadow-sm" : "text-muted")}
          >
            {t === "mentee" ? "Student mentee" : "Verified mentor"}
          </button>
        ))}
      </div>
      <div className="mt-5 space-y-4">
        <Field label="Email Address" htmlFor="email">
          <input id="email" type="email" autoComplete="email" required className="field" placeholder="username@adamson.edu.ph" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field label="Password" htmlFor="password">
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} autoComplete="current-password" required className="field pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={() => setShow(!show)} className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>
        {error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
        <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Logging in…" : "Log in"}</Button>
        <p className="text-center text-sm text-muted">
          New to Klasmeyt? <Link href="/signup" className="font-semibold text-teal-700 hover:underline">Create an account</Link>
        </p>
      </div>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col bg-paper px-4 py-8 sm:px-10">
        <Link href="/" className="w-fit"><Logo /></Link>
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <Suspense><LoginForm /></Suspense>
        </div>
      </div>
      <div className="relative hidden overflow-hidden bg-[#0B1220] lg:block">
        <Image src="/login-art.png" alt="Klasmeyt — connect, collaborate, and conquer every semester together" fill className="object-cover" priority />
      </div>
    </div>
  );
}
