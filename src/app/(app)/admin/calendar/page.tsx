import { requireRole } from "@/lib/auth";
import { profilesById, sessionsFor } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { CalendarView } from "@/components/calendar-view";

export const metadata = { title: "Admin Calendar" };

export default async function AdminCalendar({ searchParams }: { searchParams: { m?: string } }) {
  const { supabase } = await requireRole("admin");
  const sessions = await sessionsFor(supabase);
  const people = await profilesById(supabase, sessions.map((s) => s.mentor_id));
  const names = Object.fromEntries(Object.values(people).map((p) => [p.id, p.full_name]));
  return (
    <>
      <PageHeader title="Calendar" description="Sessions across the whole system, by status." pill="Admin portal" />
      <CalendarView sessions={sessions} month={searchParams.m} basePath="/admin/calendar" link="/admin/sessions" names={names} />
    </>
  );
}
