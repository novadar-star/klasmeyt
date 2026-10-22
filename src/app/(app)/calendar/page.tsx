import { requireMe } from "@/lib/auth";
import { notAttending, sessionsFor } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { CalendarView } from "@/components/calendar-view";

export const metadata = { title: "Calendar" };

export default async function CalendarPage({ searchParams }: { searchParams: { m?: string } }) {
  const { supabase, profile } = await requireMe();
  // the mentor and the mentees taking part; a mentee who can't attend doesn't get it on their calendar
  const sessions = (await sessionsFor(supabase)).filter((s) => !notAttending(s, profile.id));
  return (
    <>
      <PageHeader title="Calendar" description="Your sessions by status. Confirmed sessions show as scheduled." />
      <CalendarView sessions={sessions} month={searchParams.m} basePath="/calendar" link="/sessions" />
    </>
  );
}
