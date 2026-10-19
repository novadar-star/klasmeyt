import Link from "next/link";
import { MessagesSquare, UsersRound } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { myGroups, profilesById } from "@/lib/queries";
import { Button, Card, Empty, PageHeader } from "@/components/ui";
import { Badge } from "@/components/badges";
import { relTime, subjectName } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function ChatList() {
  const { supabase, profile } = await requireMe();
  const all = await myGroups(supabase, profile.id, profile.role);
  const groups = all.filter((g) => profile.role === "mentor" || g.members.find((m) => m.mentee_id === profile.id)?.status === "active");
  const ids = groups.map((g) => g.id);
  const { data: msgs } = ids.length
    ? await supabase.from("messages").select("group_id,body,created_at,sender_id").in("group_id", ids).order("created_at", { ascending: false }).limit(300)
    : { data: [] };
  const last: Record<string, { body: string; created_at: string; sender_id: string }> = {};
  (msgs ?? []).forEach((m) => { if (!last[m.group_id]) last[m.group_id] = m; });
  const people = await profilesById(supabase, [...groups.map((g) => g.mentor_id), ...groups.flatMap((g) => g.members.map((m) => m.mentee_id))]);
  const { data: unread } = await supabase.from("notifications").select("link").eq("type", "message").eq("read", false);
  const unreadSet = new Set((unread ?? []).map((u) => u.link));
  groups.sort((a, b) => (last[b.id]?.created_at ?? b.created_at).localeCompare(last[a.id]?.created_at ?? a.created_at));

  return (
    <>
      <PageHeader title="Messages" description="Every accepted partnership and mentoring group has its own chatbox." />
      {groups.length ? (
        <Card className="divide-y divide-line overflow-hidden">
          {groups.map((g) => {
            const l = last[g.id];
            const title = profile.role === "mentee" && g.kind === "individual" ? people[g.mentor_id]?.full_name ?? g.name : g.name;
            const isUnread = unreadSet.has(`/chat/${g.id}`);
            return (
              <Link key={g.id} href={`/chat/${g.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-paper">
                <span className={`grid size-10 shrink-0 place-items-center rounded-full ${g.kind === "group" ? "bg-slate-100 text-slate-700" : "bg-brand-50 text-brand-700"}`}>
                  {g.kind === "group" ? <UsersRound className="size-5" /> : <MessagesSquare className="size-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`truncate text-sm ${isUnread ? "font-semibold text-brand-800" : "font-semibold text-ink"}`}>{title}</p>
                    <Badge color={g.kind === "group" ? "violet" : "teal"}>{subjectName(g.subject_id)}</Badge>
                  </div>
                  <p className="truncate text-xs text-muted">
                    {l ? `${l.sender_id === profile.id ? "You" : people[l.sender_id]?.full_name.split(" ")[0] ?? ""}: ${l.body}` : "No messages yet. Say hi!"}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {l ? <span className="text-[11px] text-muted">{relTime(l.created_at)}</span> : null}
                  {isUnread ? <span className="size-2 rounded-full bg-brand-600" aria-label="Unread" /> : null}
                </div>
              </Link>
            );
          })}
        </Card>
      ) : (
        <Empty title="No chats yet" action={profile.role === "mentee" ? <Button asChild variant="primary"><Link href="/find">Find a mentor</Link></Button> : undefined}>
          A chatbox opens automatically once a partnership request is accepted.
        </Empty>
      )}
    </>
  );
}
