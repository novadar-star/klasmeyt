import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { profilesById } from "@/lib/queries";
import { Card, Empty, PageHeader } from "@/components/ui";
import { StatusBadge } from "@/components/badges";
import { cn, fmtDateTime, subjectName } from "@/lib/utils";

export const metadata = { title: "Partnership Requests" };

const F = ["", "pending", "accepted", "declined", "cancelled"];

export default async function AdminPartnerships({ searchParams }: { searchParams: { status?: string } }) {
  const { supabase } = await requireRole("admin");
  const status = searchParams.status ?? "";
  let q = supabase.from("partnership_requests").select("*").order("created_at", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const people = await profilesById(supabase, (data ?? []).flatMap((r) => [r.mentor_id, r.mentee_id]));
  return (
    <>
      <PageHeader title="Partnership Requests" description="All requests between mentees and mentors. Admins can view but don't decide requests." />
      <div className="mb-4 flex flex-wrap gap-2">
        {F.map((f) => (
          <Link key={f} href={f ? `/admin/partnerships?status=${f}` : "/admin/partnerships"} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset", status === f ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-brand-700 ring-line")}>
            {f || "All"}
          </Link>
        ))}
      </div>
      {data?.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-xs font-medium text-muted">
              <tr><th className="px-4 py-3">Mentee</th><th className="px-4 py-3">Mentor</th><th className="px-4 py-3">Subject</th><th className="px-4 py-3">Sent</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3"><Link className="font-semibold hover:underline" href={`/admin/users/${r.mentee_id}`}>{people[r.mentee_id]?.full_name}</Link></td>
                  <td className="px-4 py-3"><Link className="font-semibold hover:underline" href={`/admin/users/${r.mentor_id}`}>{people[r.mentor_id]?.full_name}</Link></td>
                  <td className="px-4 py-3 text-brand-700">{subjectName(r.subject_id)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{fmtDateTime(r.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} label={r.status === "accepted" ? "Accepted" : undefined} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Empty title="No partnership requests" />
      )}
    </>
  );
}
