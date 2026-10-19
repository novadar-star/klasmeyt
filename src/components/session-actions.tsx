"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
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
          <Button size="sm" className="h-10" disabled={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: true, p_teams_link: link }, "Session confirmed")}>Confirm session</Button>
          <Button size="sm" className="h-10" variant="danger" disabled={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: false }, "Session declined")}>Decline</Button>
        </div>
      );
    }
    if (isMentor && s.format === "group") {
      return (
        <>
          <span className="text-sm text-muted">{allResponded ? `All responded · ${confirmed} confirmed` : "Waiting for mentees to respond"}</span>
          <Button size="sm" disabled={busy || !allResponded || confirmed === 0} onClick={() => rpc("finalize_session", { p_session: s.id, p_proceed: true }, "Session scheduled")}>
            Proceed with confirmed
          </Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => rpc("finalize_session", { p_session: s.id, p_proceed: false }, "Session cancelled")}>Cancel session</Button>
        </>
      );
    }
    if (isMentor) {
      return (
        <>
          <span className="text-sm text-muted">Waiting for the mentee to confirm</span>
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => rpc("cancel_session", { p_session: s.id }, "Session cancelled")}>Cancel</Button>
        </>
      );
    }
    if (mine?.response === "pending") {
      return (
        <>
          <Button size="sm" variant="success" disabled={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: true }, "Attendance confirmed")}>Confirm attendance</Button>
          <Button size="sm" variant="danger" disabled={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: false }, "Response sent")}>Cannot attend</Button>
        </>
      );
    }
    return (
      <>
        <span className="text-sm text-muted">{mine?.response === "confirmed" ? (s.mentor_confirmed ? "You confirmed · waiting for the mentor to finalize" : "Waiting for the mentor to confirm") : "You can't attend this one"}</span>
        {s.proposed_by === me ? (
          <Button size="sm" variant="ghost" disabled={busy} onClick={() => rpc("cancel_session", { p_session: s.id }, "Session cancelled")}>Withdraw</Button>
        ) : null}
      </>
    );
  }
  if (status === "scheduled" && isMentor) {
    return <Button size="sm" variant="ghost" disabled={busy} onClick={() => rpc("cancel_session", { p_session: s.id }, "Session cancelled")}>Cancel session</Button>;
  }
  if (status === "completed" && isMentor && s.status === "scheduled") {
    return <Button size="sm" variant="ghost" disabled={busy} onClick={() => rpc("complete_session", { p_session: s.id }, "Marked as completed")}>Mark completed</Button>;
  }
  return null;
}
