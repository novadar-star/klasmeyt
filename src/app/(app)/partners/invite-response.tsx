"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { UsersRound } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { Modal } from "@/components/modal";
import { errMsg } from "@/lib/utils";

/** FR-M11: group notice before joining */
export function InviteResponse({ groupId, groupName, mentorName, members }: { groupId: string; groupName: string; mentorName: string; members: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function respond(accept: boolean) {
    setBusy(true);
    const { data, error } = await createClient().rpc("respond_group_invite", { p_group: groupId, p_accept: accept });
    setBusy(false);
    if (error) return toast.error(errMsg(error));
    setOpen(false);
    toast.success(accept ? `You joined ${groupName}` : "You'll keep a private chat with your mentor instead");
    router.push(`/chat/${data}`);
    router.refresh();
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>Review invite</Button>
      <Modal open={open} onOpenChange={setOpen} title="This is a group chat">
        <div className="flex gap-3 rounded-lg bg-violet-50 p-4 text-sm text-ink">
          <UsersRound className="size-5 shrink-0 text-violet-600" />
          <div className="space-y-2">
            <p><span className="font-semibold">{mentorName}</span> invited you to <span className="font-semibold">{groupName}</span>, a group with {members} other {members === 1 ? "mentee" : "mentees"}.</p>
            <p>Everyone in the group can read the messages you send there.</p>
            <p>You'll only see messages sent <span className="font-semibold">after you join</span>. Earlier group messages and any private chats stay hidden.</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-muted">If you'd rather not join, you'll keep a private one-on-one chat with your mentor.</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={busy} onClick={() => respond(false)}>Keep private chat</Button>
          <Button variant="teal" disabled={busy} onClick={() => respond(true)}>Join group</Button>
        </div>
      </Modal>
    </>
  );
}
