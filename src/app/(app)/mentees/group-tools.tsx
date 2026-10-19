"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { errMsg } from "@/lib/utils";

type Props =
  | { menteeId: string; menteeName: string; groups: { id: string; name: string }[]; groupId?: never; groupName?: never; candidates?: never }
  | { groupId: string; groupName: string; candidates: { id: string; name: string }[]; menteeId?: never; menteeName?: never; groups?: never };

/** Invite a mentee (with an accepted partnership for the same subject) into a group */
export function AddToGroup(props: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fromMentee = "menteeId" in props && props.menteeId;
  const options = fromMentee ? props.groups! : props.candidates!;
  const [pick, setPick] = useState(options[0]?.id ?? "");
  if (!options.length) return null;

  async function go() {
    setBusy(true);
    const { error } = await createClient().rpc("invite_to_group", {
      p_group: fromMentee ? pick : props.groupId,
      p_mentee: fromMentee ? props.menteeId : pick,
    });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    toast.success("Invite sent. The mentee joins after reading the group notice.");
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button variant="quiet" size={fromMentee ? "md" : "sm"} onClick={() => setOpen(true)}>{fromMentee ? "Add to group" : "Invite mentee"}</Button>
      <Modal
        open={open}
        onOpenChange={setOpen}
        title={fromMentee ? `Add ${props.menteeName} to a group` : `Invite to ${props.groupName}`}
        description="They'll see a notice that it's a group chat and can choose to join. Your private chat with them stays private."
      >
        <select className="field" value={pick} onChange={(e) => setPick(e.target.value)} aria-label={fromMentee ? "Group" : "Mentee"}>
          {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={go} disabled={busy || !pick}>Send invite</Button>
        </div>
      </Modal>
    </>
  );
}

export function RenameGroup({ id, name }: { id: string; name: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState(name);
  return (
    <>
      <button onClick={() => setOpen(true)} className="rounded-control p-1.5 text-muted hover:bg-paper hover:text-ink" aria-label="Rename group"><Pencil className="size-4" /></button>
      <Modal open={open} onOpenChange={setOpen} title="Rename group">
        <input className="field" value={v} onChange={(e) => setV(e.target.value)} aria-label="Group name" />
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={async () => {
              if (!v.trim()) return;
              const { error } = await createClient().from("mentoring_groups").update({ name: v.trim() }).eq("id", id);
              if (error) return toast.error(errMsg(error));
              setOpen(false);
              router.refresh();
            }}
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  );
}
