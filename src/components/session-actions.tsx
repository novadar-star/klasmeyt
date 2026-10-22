"use client";

import Link from "next/link";
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
  const total = s.participants.length;
  const waiting = s.participants.filter((p) => p.response === "pending").length;
  const confirmed = s.participants.filter((p) => p.response === "confirmed").length;
  const anotherTime = (
    <Button asChild size="sm" variant="secondary">
      <Link href={`/sessions/new?group=${s.group_id}&replace=${s.id}`}>Propose another time</Link>
    </Button>
  );

  if (status === "pending") {
    // mentor reviewing a mentee-proposed one-on-one session
    if (isMentor && !s.mentor_confirmed) {
      return (
        <div className="flex w-full flex-col gap-2 sm:flex-row">
          <input className="field sm:max-w-xs" type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="Microsoft Teams link (https://…)" value={link} onChange={(e) => setLink(e.target.value)} aria-label="Teams link" />
          <Button size="sm" className="h-10" loading={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: true, p_teams_link: link }, "Session confirmed")}>Confirm session</Button>
          <ConfirmButton size="sm" title="Decline this session?" body="The mentee is notified and can propose another time." confirmLabel="Decline session" disabled={busy} onConfirm={() => rpc("respond_session", { p_session: s.id, p_accept: false }, "Session declined")}>Decline</ConfirmButton>
        </div>
      );
    }

    if (isMentor) {
      // everyone answered, some can't attend: the mentor decides
      if (s.format === "group" && waiting === 0 && confirmed > 0) {
        return (
          <div className="w-full space-y-2">
            <p className="text-sm text-ink">
              Everyone responded: {confirmed} of {total} can attend. Go ahead with them, or find a time that works for everyone.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" loading={busy} onClick={() => rpc("finalize_session", { p_session: s.id, p_proceed: true }, "Session scheduled with the confirmed mentees")}>
                Proceed with {confirmed} confirmed
              </Button>
              {anotherTime}
            </div>
          </div>
        );
      }
      return (
        <>
          <span className="text-sm text-muted">
            {s.format === "group" ? `Waiting for ${waiting} of ${total} mentees to respond.` : "Waiting for the mentee to confirm."}
          </span>
          {s.proposed_by === me ? anotherTime : null}
          <ConfirmButton size="sm" variant="quiet" title="Cancel this session?" body="Every invited mentee is notified." confirmLabel="Cancel session" disabled={busy} onConfirm={() => rpc("cancel_session", { p_session: s.id }, "Session cancelled")}>Cancel</ConfirmButton>
        </>
      );
    }

    if (mine?.response === "pending") {
      return (
        <>
          <Button size="sm" variant="primary" loading={busy} onClick={() => rpc("respond_session", { p_session: s.id, p_accept: true }, "Attendance confirmed")}>Confirm attendance</Button>
          <ConfirmButton
            size="sm"
            title="Tell your mentor you cannot attend?"
            body={s.format === "group" ? "Your mentor sees your answer once everyone responds and decides whether to go ahead or propose another time." : "This cancels the session and notifies your mentor so they can propose another time."}
            confirmLabel="Cannot attend"
            disabled={busy}
            onConfirm={() => rpc("respond_session", { p_session: s.id, p_accept: false }, s.format === "group" ? "Your mentor was told you cannot attend" : "Session cancelled. Your mentor was notified.")}
          >
            Cannot attend
          </ConfirmButton>
        </>
      );
    }
    return (
      <>
        <span className="text-sm text-muted">
          {mine?.response === "confirmed"
            ? s.mentor_confirmed
              ? waiting ? `You confirmed. Waiting for ${waiting} more ${waiting === 1 ? "mentee" : "mentees"}.` : "You confirmed. Waiting for your mentor to decide."
              : "Waiting for your mentor to confirm and add the Teams link."
            : "You said you cannot attend."}
        </span>
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
