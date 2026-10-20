"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { ConfirmButton } from "@/components/modal";
import { errMsg } from "@/lib/utils";
import type { SessionFull } from "@/lib/queries";

export function SessionActions({ s, me, isMentor, status }: { s: SessionFull; me: string; isMentor: boolean; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState(s.teams_link ?? "");

  async function rpc(fn: string, args: Record<string, unknown>, ok: string) {
    setBusy(true);
    const { error } = await createClient().rpc(fn, args);
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success(ok);
    router.refresh();
  }

  const mine = s.participants.find((p) => p.mentee_id === me);
  const allResponded = s.participants.every((p) => p.response !== "pending");
  const confirmed = s.participants.filter((p) => p.response === "confirmed").length;

  if (status === "pending") {
    // mentor reviewing a mentee-proposed one-on-one session
    if (isMentor && !s.mentor_confirmed) {
      return (
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <input className="field sm:max-w-xs" placeholder="Microsoft Teams link (https://…)" value={link} onChange={(e) => setLink(e.target.value)} aria-label="Teams link" />
          <Button size="sm" className="h-10" loading={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: true, p_teams_link: link }, "Session confirmed")}>Confirm session</Button>
          <ConfirmButton size="sm" title="Decline this session?" body="The mentee is notified and can propose another time." confirmLabel="Decline session" disabled={busy} onConfirm={() => rpc("respond_session", { p_session: s.id, p_accept: false }, "Session declined")}>Decline</ConfirmButton>
        </div>
      );
    }
    if (isMentor && s.format === "group") {
      return (
        <>
          <span className="text-sm text-muted">{allResponded ? `Everyone responded. ${confirmed} confirmed.` : "Waiting for mentees to respond."}</span>
          <Button size="sm" disabled={busy || !allResponded || confirmed === 0} onClick={() => rpc("finalize_session", { p_session: s.id, p_proceed: true }, "Session scheduled")}>
            Proceed with confirmed
          </Button>
          <ConfirmButton size="sm" title="Cancel this group session?" body="Every invited mentee is notified. You can propose another time afterwards." confirmLabel="Cancel session" disabled={busy} onConfirm={() => rpc("finalize_session", { p_session: s.id, p_proceed: false }, "Session cancelled")}>Cancel session</ConfirmButton>
        </>
      );
    }
    if (isMentor) {
      return (
        <>
          <span className="text-sm text-muted">Waiting for the mentee to confirm.</span>
          <ConfirmButton size="sm" variant="quiet" title="Cancel this session?" body="The mentee is notified." confirmLabel="Cancel session" disabled={busy} onConfirm={() => rpc("cancel_session", { p_session: s.id }, "Session cancelled")}>Cancel</ConfirmButton>
        </>
      );
    }
    if (mine?.response === "pending") {
      return (
        <>
          <Button size="sm" variant="primary" loading={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: true }, "Attendance confirmed")}>Confirm attendance</Button>
          <ConfirmButton
            size="sm"
            title="Tell your mentor you can't attend?"
            body={s.format === "group" ? "Your mentor is notified. The session can still go ahead with the others." : "This cancels the session and notifies your mentor. Either of you can propose another time."}
            confirmLabel="I can't attend"
            disabled={busy}
            onConfirm={() => rpc("respond_session", { p_session: s.id, p_accept: false }, s.format === "group" ? "Your mentor was told you can't attend" : "Session cancelled. Your mentor was notified.")}
          >
            Can&rsquo;t attend
          </ConfirmButton>
        </>
      );
    }
    return (
      <>
        <span className="text-sm text-muted">{mine?.response === "confirmed" ? (s.mentor_confirmed ? "You confirmed. Waiting for the mentor to finalize." : "Waiting for your mentor to confirm and add the Teams link.") : "You said you can't attend this one."}</span>
        {s.proposed_by === me ? (
          <ConfirmButton size="sm" variant="quiet" title="Withdraw your proposal?" body="Your mentor is notified." confirmLabel="Withdraw proposal" disabled={busy} onConfirm={() => rpc("cancel_session", { p_session: s.id }, "Proposal withdrawn")}>Withdraw</ConfirmButton>
        ) : null}
      </>
    );
  }
  if (status === "scheduled" && isMentor) {
    return <ConfirmButton size="sm" variant="quiet" title="Cancel this scheduled session?" body="Everyone in the session is notified. This can't be undone." confirmLabel="Cancel session" disabled={busy} onConfirm={() => rpc("cancel_session", { p_session: s.id }, "Session cancelled")}>Cancel session</ConfirmButton>;
  }
  if (status === "completed" && isMentor && s.status === "scheduled") {
    return <Button size="sm" variant="quiet" disabled={busy} onClick={() => rpc("complete_session", { p_session: s.id }, "Marked as completed")}>Mark completed</Button>;
  }
  return null;
}
