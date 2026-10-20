import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarClock, Video } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { profilesById, sessionsFor } from "@/lib/queries";
import { Button, Card } from "@/components/ui";
import { Badge, StatusBadge } from "@/components/badges";
import { fmtDateTime, sessionStatus, subjectName } from "@/lib/utils";
import type { Group } from "@/lib/types";
import { ChatRoom } from "./room";

export const metadata = { title: "Chat" };

export default async function ChatPage({ params }: { params: { id: string } }) {
  const { supabase, profile } = await requireMe();
  const { data: g } = await supabase.from("mentoring_groups").select("*").eq("id", params.id).maybeSingle<Group>();
  if (!g) notFound();
  const { data: members } = await supabase.from("group_members").select("*").eq("group_id", g.id);
  const me = (members ?? []).find((m) => m.mentee_id === profile.id);
  if (profile.role === "mentee" && me?.status !== "active") notFound();

  const active = (members ?? []).filter((m) => m.status === "active");
  const people = await profilesById(supabase, [g.mentor_id, ...active.map((m) => m.mentee_id)]);
  // newest 500, shown oldest first
  const { data: latest } = await supabase.from("messages").select("*").eq("group_id", g.id).order("created_at", { ascending: false }).limit(500);
  const messages = (latest ?? []).reverse();
  const sessions = (await sessionsFor(supabase, { groupId: g.id })).filter((s) => ["pending", "scheduled"].includes(sessionStatus(s)));

  const title = profile.role === "mentee" && g.kind === "individual" ? people[g.mentor_id]?.full_name ?? g.name : g.name;
  const names = Object.fromEntries(Object.values(people).map((p) => [p.id, p.full_name]));

  return (
    <div className="-mx-4 -my-6 flex h-[calc(100dvh-3.5rem)] flex-col sm:-mx-6 lg:-mx-8 lg:-my-8 lg:h-dvh">
      <div className="border-b border-line bg-white px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/chat" className="text-xs font-semibold text-muted hover:text-ink">Messages /</Link>
              <h1 className="truncate text-lg font-semibold text-brand-800">{title}</h1>
              <Badge color={g.kind === "group" ? "violet" : "teal"}>{g.kind === "group" ? "Group" : "One-on-one"}</Badge>
              <span className="chip">{subjectName(g.subject_id)}</span>
            </div>
            <p className="mt-0.5 truncate text-xs text-muted">
              Mentor {people[g.mentor_id]?.full_name} · {active.map((m) => people[m.mentee_id]?.full_name).filter(Boolean).join(", ")}
            </p>
          </div>
          {profile.id === g.mentor_id || g.kind === "individual" ? (
            <Button asChild size="sm" variant="primary"><Link href={`/sessions/new?group=${g.id}`}><CalendarClock /> Schedule session</Link></Button>
          ) : null}
        </div>
        {sessions.length ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {sessions.map((s) => (
              <Card key={s.id} className="flex shrink-0 items-center gap-3 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold">{fmtDateTime(s.starts_at, { weekday: "short", year: undefined })}</p>
                  <p className="text-[11px] text-muted">{s.duration_min} min</p>
                </div>
                <StatusBadge status={sessionStatus(s)} />
                {s.status === "scheduled" && s.teams_link ? (
                  <a href={s.teams_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded bg-brand-700 px-2 py-1 text-xs font-medium text-white hover:bg-brand-800"><Video className="size-3" /> Join</a>
                ) : (
                  <Link href="/sessions" className="text-xs font-medium text-brand-700 hover:underline">Respond</Link>
                )}
              </Card>
            ))}
          </div>
        ) : null}
      </div>
      <ChatRoom groupId={g.id} me={profile.id} names={names} initial={messages} joinedAt={me?.joined_at ?? null} isGroup={g.kind === "group"} />
    </div>
  );
}
