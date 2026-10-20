import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { profilesById, slotsFor, subjectsFor } from "@/lib/queries";
import { Card, CardTitle, KV, PageHeader } from "@/components/ui";
import { StatusBadge, VerificationBadge } from "@/components/badges";
import { DocList, signDocs } from "@/components/doc-list";
import { SlotList } from "@/components/avail";
import { FORMAT_LABEL, fmtDateTime, subjectName } from "@/lib/utils";
import type { Doc, Profile, Verification } from "@/lib/types";
import { ReviewPanel } from "./review-panel";

export const metadata = { title: "Review" };

export default async function ReviewUser({ params }: { params: { id: string } }) {
  const { supabase } = await requireRole("admin");
  const [{ data: p }, { data: v }, { data: docs }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", params.id).maybeSingle<Profile>(),
    supabase.from("verifications").select("*").eq("user_id", params.id).maybeSingle<Verification>(),
    supabase.from("documents").select("*").eq("owner_id", params.id).order("uploaded_at", { ascending: false }),
  ]);
  if (!p || p.role === "admin") notFound();
  const isMentor = p.role === "mentor";
  const [urls, slots, subs] = await Promise.all([signDocs(supabase, (docs ?? []) as Doc[]), slotsFor(supabase, [p.id]), subjectsFor(supabase, [p.id])]);
  const { data: reqs } = await supabase.from("partnership_requests").select("*").eq(isMentor ? "mentor_id" : "mentee_id", p.id).order("created_at", { ascending: false });
  const others = await profilesById(supabase, (reqs ?? []).map((r) => (isMentor ? r.mentee_id : r.mentor_id)));

  return (
    <>
      <PageHeader
        title={isMentor ? "Mentor application" : "Mentee documents"}
        description={<Link href={isMentor ? "/admin" : "/admin/mentees"} className="hover:underline">← Back to {isMentor ? "applications queue" : "mentee verification"}</Link>}
       
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-brand-800">{p.full_name}</h2>
                <p className="text-sm text-muted">{p.email}</p>
              </div>
              <VerificationBadge status={v?.status ?? "submitted"} kind={p.role} />
            </div>
            <dl className="mt-6 grid gap-5 sm:grid-cols-2">
              <KV k="Year level" v={p.year_level} />
              <KV k="Program" v={p.program} />
              <KV k={isMentor ? "Mentoring subjects" : "Subjects needed"} v={<span className="font-semibold text-brand-700">{(subs[p.id] ?? []).map(subjectName).join(", ")}</span>} />
              <KV k="Preferred schedule" v={p.preferred_schedule} />
              <KV k="Availability" v={<SlotList slots={slots[p.id]} />} />
              <KV k="Modality" v={p.modality} />
              {isMentor ? <KV k="Mentoring format" v={FORMAT_LABEL[p.mentoring_format ?? "both"]} /> : null}
              {isMentor ? <KV k="Privacy notice accepted" v={p.privacy_consent_at ? fmtDateTime(p.privacy_consent_at) : "No"} /> : null}
            </dl>
            <dl className="mt-6 space-y-5 border-t border-line pt-6">
              {isMentor ? <KV k="Mentoring introduction" v={p.intro} /> : null}
              {isMentor ? <KV k="Academic experience" v={p.academic_experience} /> : null}
              {isMentor ? <KV k="Skills & achievements" v={p.skills_achievements} /> : null}
              <KV k="About" v={p.about} />
              <KV k="Academic interests" v={p.interests} />
            </dl>
          </Card>
          <Card className="p-6">
            <CardTitle>Partnership activity</CardTitle>
            {(reqs ?? []).length ? (
              <ul className="divide-y divide-line">
                {(reqs ?? []).map((r) => (
                  <li key={r.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                    <span className="flex-1">{others[isMentor ? r.mentee_id : r.mentor_id]?.full_name}</span>
                    <span className="text-xs text-muted">{subjectName(r.subject_id)}</span>
                    <StatusBadge status={r.status} label={r.status === "accepted" ? "Accepted" : undefined} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No partnership requests yet.</p>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="p-6">
            <CardTitle>Uploaded documents</CardTitle>
            <DocList docs={(docs ?? []) as Doc[]} urls={urls} />
          </Card>
          <ReviewPanel userId={p.id} isMentor={isMentor} status={v?.status ?? "submitted"} note={v?.reviewer_note ?? ""} vouchedBy={p.vouched_by ?? ""} reviewedAt={v?.reviewed_at ?? null} />
        </div>
      </div>
    </>
  );
}
