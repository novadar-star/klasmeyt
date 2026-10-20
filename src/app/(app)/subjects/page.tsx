import Link from "next/link";
import { requireVerified } from "@/lib/auth";
import { myGroups } from "@/lib/queries";
import { Button, Card, CardTitle, PageHeader } from "@/components/ui";
import { SlotList } from "@/components/avail";
import { subjectName } from "@/lib/utils";
import type { Slot } from "@/lib/types";

export const metadata = { title: "My subjects" };

export default async function SubjectsPage() {
  const { supabase, profile } = await requireVerified("mentor");
  const [{ data: subs }, { data: slots }, groups] = await Promise.all([
    supabase.from("user_subjects").select("subject_id").eq("user_id", profile.id),
    supabase.from("availability").select("*").eq("user_id", profile.id).order("day").order("start_time"),
    myGroups(supabase, profile.id, "mentor"),
  ]);
  return (
    <>
      <PageHeader title="My subjects" description="The subjects you mentor and the hours you're free each week." action={<Button asChild size="sm" variant="secondary"><Link href="/profile">Edit in profile</Link></Button>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {(subs ?? []).map(({ subject_id }) => {
            const gs = groups.filter((g) => g.subject_id === subject_id);
            const mentees = new Set(gs.flatMap((g) => g.members.filter((m) => m.status === "active").map((m) => m.mentee_id)));
            return (
              <Card key={subject_id} className="flex items-center justify-between gap-3 p-5">
                <div>
                  <p className="font-semibold text-brand-800">{subjectName(subject_id)}</p>
                  <p className="text-xs text-muted">{mentees.size} active {mentees.size === 1 ? "mentee" : "mentees"}, {gs.filter((g) => g.kind === "group").length} study {gs.filter((g) => g.kind === "group").length === 1 ? "group" : "groups"}</p>
                </div>
                <Button asChild variant="secondary" size="sm"><Link href="/mentees">View mentees</Link></Button>
              </Card>
            );
          })}
        </div>
        <Card className="p-5">
          <CardTitle>Your weekly availability</CardTitle>
          <SlotList slots={(slots ?? []) as Slot[]} />
        </Card>
      </div>
    </>
  );
}
