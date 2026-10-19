import Link from "next/link";
import { notFound } from "next/navigation";
import { requireVerified } from "@/lib/auth";
import { slotsFor, subjectsFor } from "@/lib/queries";
import { Button, Card, PageHeader } from "@/components/ui";
import { VerifiedMentorBadge, VouchedBadge } from "@/components/badges";
import { SlotList } from "@/components/avail";
import { FORMAT_LABEL, subjectName } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Mentor profile" };

export default async function MentorProfile({ params }: { params: { id: string } }) {
  const { supabase } = await requireVerified("mentee");
  const { data: m } = await supabase.from("profiles").select("*").eq("id", params.id).eq("role", "mentor").maybeSingle<Profile>();
  if (!m) notFound();
  const [slots, subs] = await Promise.all([slotsFor(supabase, [m.id]), subjectsFor(supabase, [m.id])]);

  return (
    <>
      <PageHeader title={`${m.full_name} - Peer Mentor Profile`} description="Adamson University peer mentoring" />
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <div className="space-y-4">
          <Card className="p-6 text-center">
            <h2 className="text-lg font-semibold text-brand-800">{m.full_name}</h2>
            <p className="text-xs text-muted">{[m.year_level, m.program].filter(Boolean).join(" • ")}</p>
            <div className="mt-3 flex flex-col items-center gap-2">
              <VerifiedMentorBadge />
              <VouchedBadge by={m.vouched_by} />
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold text-brand-800">Availability &amp; format</h3>
            <p className="eyebrow mt-4">Courses</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(subs[m.id] ?? []).map((id) => <span key={id} className="text-sm font-semibold text-brand-700">{subjectName(id)}</span>)}
            </div>
            <p className="eyebrow mt-4">Availability schedule</p>
            <div className="mt-1.5"><SlotList slots={slots[m.id]} /></div>
            <p className="eyebrow mt-4">Format & modality</p>
            <p className="mt-1 text-sm">{FORMAT_LABEL[m.mentoring_format ?? "both"]}{m.modality ? ` · ${m.modality}` : ""}</p>
          </Card>
        </div>
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-brand-800">About this mentor</h3>
            <div className="flex gap-2">
              <Button asChild variant="secondary" size="sm"><Link href={`/mentors/${m.id}/cv`}>View sample CV</Link></Button>
              <Button asChild variant="primary" size="sm"><Link href={`/mentors/${m.id}/request`}>Request partnership</Link></Button>
            </div>
          </div>
          <div className="mt-6 space-y-5 text-sm leading-relaxed">
            {[
              ["Introduction", m.intro],
              ["About me", m.about],
              ["Academic experience", m.academic_experience],
              ["Skills & achievements", m.skills_achievements],
              ["Academic interests", m.interests],
            ].map(([k, v]) =>
              v ? (
                <div key={k}>
                  <p className="text-xs font-semibold text-brand-700">{k}</p>
                  <p className="mt-1 whitespace-pre-line text-ink">{v}</p>
                </div>
              ) : null
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
