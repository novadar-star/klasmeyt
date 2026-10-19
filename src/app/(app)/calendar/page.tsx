import { requireMe } from "@/lib/auth";
import { sessionsFor } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { CalendarView } from "@/components/calendar-view";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: { m?: string } }) {
  const { supabase } = await requireMe();
  const sessions = await sessionsFor(supabase);
  return (
    <>
      <PageHeader title="Calendar" description="Your sessions by status. Confirmed sessions show as scheduled." />
      <CalendarView sessions={sessions} month={searchParams.m} basePath="/calendar" link="/sessions" />
    </>
  );
}
