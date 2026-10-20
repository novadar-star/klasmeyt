import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { requireVerified } from "@/lib/auth";
import { subjectsFor } from "@/lib/queries";
import { Card, PageHeader } from "@/components/ui";
import { signDocs } from "@/components/doc-list";
import { subjectName } from "@/lib/utils";
import type { Doc, Profile } from "@/lib/types";

export const metadata = { title: "Mentor CV" };

export default async function MentorCV({ params }: { params: { id: string } }) {
  const { supabase } = await requireVerified("mentee");
  const { data: m } = await supabase.from("profiles").select("*").eq("id", params.id).eq("role", "mentor").maybeSingle<Profile>();
  if (!m) notFound();
  const [{ data: docs }, subs] = await Promise.all([
    supabase.from("documents").select("*").eq("owner_id", m.id).eq("type", "cv").order("uploaded_at", { ascending: false }).limit(1),
    subjectsFor(supabase, [m.id]),
  ]);
  const cv = (docs?.[0] ?? null) as Doc | null;
  const urls = cv ? await signDocs(supabase, [cv]) : {};

  return (
    <>
      <PageHeader title={`${m.full_name}'s CV`} description="A summary from their profile. Open the uploaded file for the full CV." />
      {cv && urls[cv.path] ? (
        <a href={urls[cv.path]} target="_blank" rel="noreferrer" className="mb-4 flex max-w-3xl items-center justify-between gap-3 rounded-control border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 transition-colors duration-150 hover:bg-brand-50">
          Open the uploaded CV file ({cv.file_name}) <ExternalLink className="size-4" />
        </a>
      ) : null}
      <Card className="max-w-3xl p-8">
        <div className="border-b border-line pb-5 text-center">
          <h2 className="text-2xl font-semibold text-brand-800">{m.full_name}</h2>
          <p className="mt-1 text-sm text-muted">{[m.program, m.year_level].filter(Boolean).join(", ")}</p>
          <p className="mt-1 text-xs font-semibold text-brand-600">Adamson University</p>
        </div>
        <div className="mt-6 space-y-5 text-sm">
          <div>
            <p className="text-xs font-semibold text-brand-700">Education</p>
            <p className="mt-1 font-semibold">Adamson University, Manila, PH</p>
            <p className="text-muted">{m.program}{m.year_level ? `, ${m.year_level}` : ""}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-700">Mentoring subjects</p>
            <p className="mt-1">{(subs[m.id] ?? []).map(subjectName).join(", ")}</p>
          </div>
          {m.academic_experience ? (
            <div>
              <p className="text-xs font-semibold text-brand-700">Academic experience</p>
              <p className="mt-1 whitespace-pre-line">{m.academic_experience}</p>
            </div>
          ) : null}
          {m.skills_achievements ? (
            <div>
              <p className="text-xs font-semibold text-brand-700">Skills & achievements</p>
              <p className="mt-1 whitespace-pre-line">{m.skills_achievements}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs font-semibold text-brand-700">Mentoring experience</p>
            <p className="mt-1">Verified mentor on Klasmeyt.{m.vouched_by ? ` Vouched for by ${m.vouched_by}.` : ""}</p>
          </div>
        </div>
      </Card>
    </>
  );
}
