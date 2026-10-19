import { requireMe } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ProfileForm } from "./profile-form";
import type { Slot } from "@/lib/types";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const { supabase, profile, verified } = await requireMe();
  const [{ data: subs }, { data: slots }] = await Promise.all([
    supabase.from("user_subjects").select("subject_id").eq("user_id", profile.id),
    supabase.from("availability").select("*").eq("user_id", profile.id).order("day").order("start_time"),
  ]);
  const isMentor = profile.role === "mentor";
  return (
    <>
      <PageHeader
        title={isMentor ? "Edit Mentor Profile" : "Edit Mentee Profile"}
        description="Manage your personal details, subjects, and weekly availability."
      />
      <ProfileForm
        profile={profile}
        verified={verified}
        subjects={(subs ?? []).map((s) => s.subject_id)}
        slots={((slots ?? []) as Slot[]).map((s) => ({ day: s.day, start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) }))}
      />
    </>
  );
}
