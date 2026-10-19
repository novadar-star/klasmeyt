"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { ConfirmButton, Modal } from "@/components/modal";
import { cn, errMsg, subjectName } from "@/lib/utils";

export function CancelRequest({ id }: { id: string }) {
  const router = useRouter();
  return (
    <ConfirmButton
      size="sm"
      title="Withdraw this request?"
      body="The mentor won't see it anymore. You can send a new one later."
      confirmLabel="Withdraw request"
      onConfirm={async () => {
        const { error } = await createClient().rpc("cancel_request", { p_request: id });
        if (error) return toast.error(errMsg(error));
        toast.success("Request withdrawn");
        router.refresh();
      }}
    >
      Withdraw
    </ConfirmButton>
  );
}

type Mode = "individual" | "existing_group" | "new_group";

export function RespondRequest({ id, subjectId, menteeName, groups }: { id: string; subjectId: number; menteeName: string; groups: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("individual");
  const [group, setGroup] = useState(groups[0]?.id ?? "");
  const [name, setName] = useState(`${subjectName(subjectId)} Study Group`);
  const [busy, setBusy] = useState(false);

  async function respond(accept: boolean) {
    setBusy(true);
    const { data, error } = await createClient().rpc("respond_request", {
      p_request: id,
      p_accept: accept,
      p_mode: mode,
      p_group: mode === "existing_group" ? group : null,
      p_group_name: mode === "new_group" ? name : null,
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    setOpen(false);
    if (!accept) {
      toast.success("Request declined");
    } else {
      toast.success(mode === "existing_group" ? `${menteeName} was invited to the group` : "Request accepted. A chatbox was created.");
      if (data && mode !== "existing_group") router.push(`/chat/${data}`);
    }
    router.refresh();
  }

  const opts: { v: Mode; title: string; body: string; disabled?: boolean }[] = [
    { v: "individual", title: "One-on-one", body: "Create a private chatbox with this mentee." },
    { v: "existing_group", title: "Add to an existing group", body: groups.length ? "The mentee sees a group notice and joins when they accept." : `You have no ${subjectName(subjectId)} groups yet.`, disabled: !groups.length },
    { v: "new_group", title: "Start a new group", body: "Create a group chat for this subject. You can add more compatible mentees later." },
  ];

  return (
    <>
      <Button onClick={() => setOpen(true)}>Accept request</Button>
      <ConfirmButton variant="secondary" title={`Decline ${menteeName}'s request?`} body="They'll be notified and can ask another mentor." confirmLabel="Decline request" disabled={busy} onConfirm={() => respond(false)}>Decline</ConfirmButton>
      <Modal open={open} onOpenChange={setOpen} title={`Accept ${menteeName}?`} description={`Choose how you'll mentor them in ${subjectName(subjectId)}.`}>
        <div className="space-y-2">
          {opts.map((o) => (
            <label
              key={o.v}
              className={cn(
                "flex cursor-pointer gap-3 rounded-control p-3 ring-1 ring-inset",
                mode === o.v ? "bg-brand-50/60 ring-brand-500" : "ring-line hover:ring-brand-300",
                o.disabled && "cursor-not-allowed opacity-50"
              )}
            >
              <input type="radio" name="mode" className="mt-1 accent-brand-600" checked={mode === o.v} disabled={o.disabled} onChange={() => setMode(o.v)} />
              <span>
                <span className="block text-sm font-semibold text-brand-700">{o.title}</span>
                <span className="block text-xs text-muted">{o.body}</span>
              </span>
            </label>
          ))}
        </div>
        {mode === "existing_group" && groups.length ? (
          <select className="field mt-4" value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Group">
            {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        ) : null}
        {mode === "new_group" ? <input className="field mt-4" value={name} onChange={(e) => setName(e.target.value)} aria-label="Group name" /> : null}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={() => respond(true)} loading={busy}>Accept request</Button>
        </div>
      </Modal>
    </>
  );
}
