"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button, Card, Field } from "@/components/ui";
import { ConfirmButton } from "@/components/modal";
import { verificationLabel } from "@/components/badges";
import { errMsg, fmtDateTime } from "@/lib/utils";

export function ReviewPanel({ userId, isMentor, status, note: n0, vouchedBy: vb0, reviewedAt }: { userId: string; isMentor: boolean; status: string; note: string; vouchedBy: string; reviewedAt: string | null }) {
  const router = useRouter();
  const [note, setNote] = useState(n0);
  const [vouched, setVouched] = useState(vb0);
  const [busy, setBusy] = useState(false);

  async function setStatus(next: string) {
    if ((next === "rejected" || next === "info_requested") && !note.trim()) return toast.error("Add a note so the student knows what to fix.");
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("verifications").update({ status: next, reviewer_note: note.trim() || null }).eq("user_id", userId);
    if (!error && isMentor && vouched !== vb0) await supabase.from("profiles").update({ vouched_by: vouched.trim() || null }).eq("id", userId);
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(`Status set to ${verificationLabel(next)}. The student was notified.`);
    router.refresh();
  }

  async function saveVouched() {
    setBusy(true);
    const { error } = await createClient().from("profiles").update({ vouched_by: vouched.trim() || null }).eq("id", userId);
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Vouched By saved");
    router.refresh();
  }

  return (
    <Card className="p-6">
      <h2 className="text-base font-semibold text-brand-800">Verification decision</h2>
      <p className="mt-1 text-xs text-muted">Current: {verificationLabel(status)}{reviewedAt ? ` · reviewed ${fmtDateTime(reviewedAt)}` : ""}</p>
      <div className="mt-5 space-y-4">
        {isMentor ? (
          <Field label="Vouched by" htmlFor="vb" hint="Shown on the mentor's card and profile. Only admins can edit this.">
            <div className="flex gap-2">
              <input id="vb" className="field" placeholder="Engr. Reyes" value={vouched} onChange={(e) => setVouched(e.target.value)} />
              <Button variant="secondary" onClick={saveVouched} disabled={busy || vouched === vb0}>Save</Button>
            </div>
          </Field>
        ) : null}
        <Field label="Note to student" htmlFor="nt" hint="Required when rejecting or requesting more information.">
          <textarea id="nt" rows={3} className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Your COE is blurry. Please upload a clearer copy." />
        </Field>
        <div className="grid gap-2">
          {status !== "under_review" && status !== "verified" ? (
            <Button variant="secondary" disabled={busy} onClick={() => setStatus("under_review")}>Mark as under review</Button>
          ) : null}
          <Button variant="primary" disabled={busy || status === "verified"} onClick={() => setStatus("verified")}>{isMentor ? "Approve mentor" : "Verify mentee"}</Button>
          <Button variant="orange" disabled={busy} onClick={() => setStatus("info_requested")}>Request more information</Button>
          <ConfirmButton title={isMentor ? "Reject this application?" : "Reject this verification?"} body="The student is notified with your note. You can change the status later." confirmLabel="Reject" disabled={busy || status === "rejected"} onConfirm={() => setStatus("rejected")}>Reject</ConfirmButton>
        </div>
      </div>
    </Card>
  );
}
