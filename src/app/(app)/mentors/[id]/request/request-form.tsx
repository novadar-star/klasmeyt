"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card } from "@/components/ui";
import { errMsg, subjectName } from "@/lib/utils";

export function RequestForm({ mentor, subjects, initial }: { mentor: { id: string; name: string; program: string | null }; subjects: number[]; initial?: number }) {
  const router = useRouter();
  const [subject, setSubject] = useState<number | undefined>(initial);
  const [message, setMessage] = useState(`I would like to request you as my peer mentor for ${subjectName(initial)}.`);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!subject) return setError("Choose a subject.");
    setBusy(true);
    setError(null);
    const supabase = createClient();
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("partnership_requests").insert({ mentee_id: u.user!.id, mentor_id: mentor.id, subject_id: subject, message: message.trim() || null });
    setBusy(false);
    if (error) {
      setError(error.code === "23505" ? "You already have a pending request with this mentor for this subject." : errMsg(error));
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done)
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-50 text-brand-600"><CircleCheck className="size-6" /></span>
        <h2 className="mt-4 text-lg font-semibold text-brand-800">Request Sent</h2>
        <p className="mt-1 text-sm text-muted">{mentor.name} has been notified of your study partnership request.</p>
        <Button asChild className="mt-6 w-full"><Link href="/requests">Back to portal</Link></Button>
      </Card>
    );

  return (
    <Card className="max-w-lg p-6">
      <h2 className="text-lg font-semibold text-brand-800">Send Partnership Request?</h2>
      <p className="eyebrow mt-5">Proposed mentor</p>
      <p className="mt-1 font-semibold">{mentor.name}</p>
      {mentor.program ? <p className="text-xs text-muted">{mentor.program}</p> : null}
      <label className="eyebrow mt-5 block" htmlFor="sub">Subject / course</label>
      <select id="sub" className="field mt-1.5 font-semibold text-brand-700" value={subject ?? ""} onChange={(e) => setSubject(Number(e.target.value))}>
        {subjects.map((s) => <option key={s} value={s}>{subjectName(s)}</option>)}
      </select>
      <label className="eyebrow mt-5 block" htmlFor="msg">Personal message</label>
      <textarea id="msg" rows={4} className="field mt-1.5" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} />
      {error ? <p className="mt-3 rounded-control bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={() => router.back()} disabled={busy}>Cancel</Button>
        <Button variant="primary" onClick={send} disabled={busy}>{busy ? "Sending…" : "Send request"}</Button>
      </div>
    </Card>
  );
}
