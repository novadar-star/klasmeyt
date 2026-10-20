import { requireRole } from "@/lib/auth";
import { profilesById } from "@/lib/queries";
import { Card, Empty, PageHeader } from "@/components/ui";
import { Badge, StatusBadge } from "@/components/badges";
import { fmtDate, subjectName } from "@/lib/utils";

export const metadata = { title: "Partnerships and groups" };

export default async function AdminGroups() {
  const { supabase } = await requireRole("admin");
  const { data: groups } = await supabase.from("mentoring_groups").select("*").order("created_at", { ascending: false });
  const ids = (groups ?? []).map((g) => g.id);
  const { data: members } = ids.length ? await supabase.from("group_members").select("*").in("group_id", ids) : { data: [] };
  const people = await profilesById(supabase, [...(groups ?? []).map((g) => g.mentor_id), ...(members ?? []).map((m) => m.mentee_id)]);
  const list = groups ?? [];
  return (
    <>
      <PageHeader title="Partnerships and groups" description="Every one-on-one partnership and study group. Message contents stay private to members." />
      {list.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((g) => {
            const ms = (members ?? []).filter((m) => m.group_id === g.id && m.status !== "left");
            return (
              <Card key={g.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-brand-800">{g.name}</p>
                    <p className="text-xs text-muted">Mentor {people[g.mentor_id]?.full_name} · created {fmtDate(g.created_at)}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge color={g.kind === "group" ? "violet" : "teal"}>{g.kind === "group" ? "Group" : "One-on-one"}</Badge>
                    <span className="chip">{subjectName(g.subject_id)}</span>
                  </div>
                </div>
                <ul className="mt-3 space-y-1">
                  {ms.map((m) => (
                    <li key={m.mentee_id} className="flex items-center justify-between text-sm">
                      <span>{people[m.mentee_id]?.full_name}</span>
                      <StatusBadge status={m.status} />
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty title="No partnerships or groups yet" />
      )}
    </>
  );
}
