import { notFound } from "next/navigation";
import { requireVerified } from "@/lib/auth";
import { slotsFor, subjectsFor } from "@/lib/queries";
import { Card, KV, PageHeader } from "@/components/ui";
import { Badge } from "@/components/badges";
import { daysText, timeText } from "@/components/avail";
import { subjectName } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Mentee profile" };

export default async function MenteeDossier({ params }: { params: { id: string } }) {
  const { supabase } = await requireVerified("mentor");
  const { data: p } = await supabase.from("profiles").select("*").eq("id", params.id).eq("role", "mentee").maybeSingle<Profile>();
  if (!p) notFound(); // RLS only returns mentees connected to this mentor
  const [slots, subs] = await Promise.all([slotsFor(supabase, [p.id]), subjectsFor(supabase, [p.id])]);
  return (
    <>
      <PageHeader title="Mentee profile" description="What this mentee shared when they registered." />
      <Card className="max-w-3xl p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-semibold text-brand-800">{p.full_name}</h2>
          <Badge color="solidAmber">Mentee</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">{[p.year_level, p.program, "Adamson University"].filter(Boolean).join(" • ")}</p>
        <dl className="mt-6 grid gap-5 border-y border-line py-6 sm:grid-cols-2">
          <KV k="Email address" v={p.email} />
          <KV k="Course requiring help" v={<span className="font-semibold text-brand-700">{(subs[p.id] ?? []).map(subjectName).join(", ")}</span>} />
          <KV k="Weekly availability" v={`${daysText(slots[p.id])} (${timeText(slots[p.id])})`} />
          <KV k="Preferred modality" v={p.modality} />
          <KV k="Preferred study schedule" v={p.preferred_schedule} />
        </dl>
        <dl className="mt-6 space-y-5">
          <KV k="About me" v={p.about} />
          <KV k="Academic interests" v={p.interests} />
        </dl>
        <p className="mt-6 rounded-control bg-paper px-3 py-2 text-[11px] text-muted">This mentee record is read-only. Documents are visible only to the mentee and Klasmeyt administrators.</p>
      </Card>
    </>
  );
}
