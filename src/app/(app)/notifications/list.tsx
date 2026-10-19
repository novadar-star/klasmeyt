"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, Handshake, MessagesSquare, ShieldCheck, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button, Card } from "@/components/ui";
import { cn, relTime } from "@/lib/utils";

type N = { id: string; type: string; title: string; body: string | null; link: string | null; read: boolean; created_at: string };

const ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  verification: ShieldCheck,
  request: Handshake,
  group: UsersRound,
  message: MessagesSquare,
  session: CalendarClock,
};

export function NotificationList({ items }: { items: N[] }) {
  const router = useRouter();
  const unread = items.filter((n) => !n.read).length;

  async function markAll() {
    await createClient().from("notifications").update({ read: true }).eq("read", false);
    router.refresh();
  }
  async function open(n: N) {
    if (!n.read) await createClient().from("notifications").update({ read: true }).eq("id", n.id);
    router.refresh();
  }

  return (
    <>
      {unread > 0 && (
        <div className="mb-3 flex justify-end">
          <Button variant="ghost" size="sm" onClick={markAll}>Mark all as read</Button>
        </div>
      )}
      <Card className="divide-y divide-line overflow-hidden">
        {items.map((n) => {
          const Icon = ICON[n.type] ?? Bell;
          const inner = (
            <div className={cn("flex gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50/60", !n.read && "bg-brand-50/40")}>
              <span className={cn("mt-0.5 grid size-9 shrink-0 place-items-center rounded-full", n.read ? "bg-slate-100 text-slate-500" : "bg-brand-600 text-white")}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                {n.body ? <p className="mt-0.5 text-sm text-muted">{n.body}</p> : null}
                <p className="mt-1 text-xs text-muted">{relTime(n.created_at)}</p>
              </div>
              {!n.read ? <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-600" aria-label="Unread" /> : null}
            </div>
          );
          return n.link ? (
            <Link key={n.id} href={n.link} onClick={() => open(n)} className="block">{inner}</Link>
          ) : (
            <button key={n.id} onClick={() => open(n)} className="block w-full text-left">{inner}</button>
          );
        })}
      </Card>
    </>
  );
}
