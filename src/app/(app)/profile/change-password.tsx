"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field } from "@/components/ui";
import { passwordProblem } from "@/lib/password";

/** Works without email: re-checks the current password, then sets the new one and signs out other devices. */
export function ChangePassword({ email }: { email: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const current = String(fd.get("current") ?? "");
    const next = String(fd.get("new") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    const problem = passwordProblem(next, email);
    if (problem) return setError(problem);
    if (next !== confirm) return setError("The new passwords don't match.");
    if (next === current) return setError("Choose a password you haven't used here.");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password: current });
    if (authErr) {
      setBusy(false);
      return setError("Your current password is incorrect.");
    }
    const { error: upErr } = await supabase.auth.updateUser({ password: next });
    if (!upErr) await supabase.auth.signOut({ scope: "others" });
    setBusy(false);
    if (upErr) return setError(upErr.message);
    form.reset();
    toast.success("Password changed. Other devices were logged out.");
  }

  return (
    <Card className="mt-6 max-w-3xl p-6 sm:p-8">
      <h2 className="text-base font-semibold text-brand-800">Change password</h2>
      <form onSubmit={submit} noValidate className="mt-4 grid gap-4 sm:grid-cols-3">
        <Field label="Current password" htmlFor="cp-current">
          <input id="cp-current" name="current" type="password" autoComplete="current-password" className="field" required />
        </Field>
        <Field label="New password" htmlFor="cp-new" hint="8+ characters, letters and numbers.">
          <input id="cp-new" name="new" type="password" autoComplete="new-password" className="field" required />
        </Field>
        <Field label="Confirm new password" htmlFor="cp-confirm">
          <input id="cp-confirm" name="confirm" type="password" autoComplete="new-password" className="field" required />
        </Field>
        <p aria-live="polite" className={error ? "text-sm text-red-700 sm:col-span-3" : "sr-only"}>{error}</p>
        <div className="sm:col-span-3">
          <Button type="submit" variant="secondary" loading={busy}>Change password</Button>
        </div>
      </form>
    </Card>
  );
}
