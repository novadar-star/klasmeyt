"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { SendHorizontal } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn, fmtClock, fmtDate } from "@/lib/utils";

type Msg = { id: string; group_id: string; sender_id: string; body: string; created_at: string };

export function ChatRoom({ groupId, me, names, initial, joinedAt, isGroup }: { groupId: string; me: string; names: Record<string, string>; initial: Msg[]; joinedAt: string | null; isGroup: boolean }) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set()); // ids that arrived after mount get the entry animation
  const bottom = useRef<HTMLDivElement>(null);
  const supabase = useRef(createClient()).current;

  useLayoutEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  // realtime (FR-C3) + mark this chat's notifications read
  useEffect(() => {
    supabase.from("notifications").update({ read: true }).eq("type", "message").eq("link", `/chat/${groupId}`).eq("read", false).then(() => {});
    const ch = supabase
      .channel(`chat-${groupId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `group_id=eq.${groupId}` }, (payload) => {
        const m = payload.new as Msg;
        setFresh((f) => new Set(f).add(m.id));
        setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        if (m.sender_id !== me) {
          supabase.from("notifications").update({ read: true }).eq("type", "message").eq("link", `/chat/${groupId}`).eq("read", false).then(() => {});
        }
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [groupId, me, supabase]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    setSending(true);
    const { data, error } = await supabase.from("messages").insert({ group_id: groupId, sender_id: me, body }).select().single();
    setSending(false);
    if (error) return toast.error("Message not sent. Check your connection and try again.");
    setText("");
    setFresh((f) => new Set(f).add(data.id));
    setMsgs((cur) => (cur.some((x) => x.id === data.id) ? cur : [...cur, data as Msg]));
  }

  let lastDay = "";
  return (
    <>
      <div className="flex-1 overflow-y-auto bg-paper px-4 py-5 sm:px-6 lg:px-8">
        {isGroup && joinedAt ? (
          <p className="mx-auto mb-4 max-w-md rounded-control bg-pad-50 px-3 py-2 text-center text-xs text-pad-800 ring-1 ring-inset ring-pad-200">
            Group chat. You see messages from when you joined ({fmtDate(joinedAt)}) onward.
          </p>
        ) : null}
        {!msgs.length ? <p className="py-16 text-center text-sm text-muted">No messages yet. Say hello and mention what you&rsquo;re working on.</p> : null}
        <div className="mx-auto max-w-3xl space-y-2" role="log" aria-live="polite" aria-label="Messages">
          {msgs.map((m, i) => {
            const mine = m.sender_id === me;
            const day = fmtDate(m.created_at);
            const showDay = day !== lastDay;
            lastDay = day;
            const showName = !mine && (i === 0 || msgs[i - 1].sender_id !== m.sender_id || showDay);
            const system = m.body.endsWith(" joined the group") && m.body.startsWith(names[m.sender_id] ?? "\u0000");
            return (
              <div key={m.id}>
                {showDay ? <p className="my-4 text-center text-xs font-medium text-muted">{day}</p> : null}
                {system ? (
                  <p className="text-center text-[11px] text-muted">{m.body}</p>
                ) : (
                  <div className={cn("flex flex-col", mine ? "items-end" : "items-start", fresh.has(m.id) && "msg-in")}>
                    {showName ? <span className="mb-0.5 px-1 text-[11px] font-semibold text-muted">{names[m.sender_id] ?? "Member"}</span> : null}
                    <div className={cn("max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm", mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-white text-ink ring-1 ring-line")}>
                      {m.body}
                    </div>
                    <span className="mt-0.5 px-1 text-xs text-muted">{fmtClock(m.created_at)}</span>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={bottom} />
        </div>
      </div>
      <form onSubmit={send} className="flex items-end gap-2 border-t border-line bg-white px-4 py-3 sm:px-6 lg:px-8">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              (e.currentTarget.form as HTMLFormElement).requestSubmit();
            }
          }}
          rows={1}
          maxLength={4000}
          placeholder="Write a message…"
          name="message"
          autoComplete="off"
          className="field max-h-32 min-h-[40px] flex-1 resize-none"
          aria-label="Message"
        />
        <button type="submit" disabled={sending || !text.trim()} className="grid size-10 shrink-0 place-items-center rounded-control bg-brand-600 text-white transition-[transform,background-color] duration-150 ease-out hover:bg-brand-700 active:scale-[0.94] motion-reduce:active:scale-100 motion-reduce:active:opacity-80 disabled:opacity-40" aria-label="Send">
          <SendHorizontal className="size-4" aria-hidden />
        </button>
      </form>
    </>
  );
}
