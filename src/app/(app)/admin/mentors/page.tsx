import { requireRole } from "@/lib/auth";
import { OPEN_STATUSES, applicants } from "@/lib/admin";
import { slotsFor, subjectsFor } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { AdminPeople } from "@/components/admin-people";

export const metadata = { title: "Verified Mentors" };

export default async function Page({ searchParams }: { searchParams: { status?: string } }) {
  const { supabase } = await requireRole("admin");
  const filter = searchParams.status ?? "verified";
  const all = await applicants(supabase, "mentor");
  const rows = all.filter((r) => (filter === "" ? true : filter === "open" ? OPEN_STATUSES.includes(r.status) : r.status === filter));
  const ids = rows.map((r) => r.user_id);
  const [subs, slots, { data: reqs }] = await Promise.all([
    subjectsFor(supabase, ids),
    slotsFor(supabase, ids),
    supabase.from("partnership_requests").select("mentor_id,mentee_id").eq("status", "accepted"),
  ]);
  const counts: Record<string, number> = {};
  (reqs ?? []).forEach((r) => {
    const id = r.mentor_id;
    counts[id] = (counts[id] ?? 0) + 1;
  });
  return (
    <>
      <PageHeader title="Verified Mentors" description="Mentor profiles, subjects, availability, and partnership activity." pill="Admin portal" />
      <AdminPeople rows={rows} base="/admin/mentors" filter={filter} subs={subs} slots={slots} counts={counts} kind="mentor" />
    </>
  );
}
