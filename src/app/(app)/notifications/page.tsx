import { requireMe } from "@/lib/auth";
import { Empty, PageHeader } from "@/components/ui";
import { NotificationList } from "./list";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const { supabase } = await requireMe();
  const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <div className="max-w-3xl">
      <PageHeader title="Notifications" description="Updates on your account, requests, groups, messages, and sessions." />
      {data?.length ? <NotificationList items={data} /> : <Empty title="You're all caught up">New requests, messages, and session updates will show up here.</Empty>}
    </div>
  );
}
