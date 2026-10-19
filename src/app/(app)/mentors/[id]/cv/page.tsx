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
      <PageHeader title="Sample Student Mentor CV" description="Credentials preview from the mentor's verified profile" />
      {cv && urls[cv.path] ? (
        <a href={urls[cv.path]} target="_blank" rel="noreferrer" className="mb-4 flex max-w-3xl items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100">
          Open the uploaded CV file ({cv.file_name}) <ExternalLink className="size-4" />
        </a>
      ) : null}
      <Card className="max-w-3xl p-8">
        <div className="border-b border-line pb-5 text-center">
          <h2 className="text-2xl font-bold text-brand-700">{m.full_name}</h2>
          <p className="mt-1 text-sm text-muted">{m.email} · {[m.program, m.year_level].filter(Boolean).join(" (") + (m.program && m.year_level ? ")" : "")}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-teal-600">Adamson University</p>
        </div>
        <div className="mt-6 space-y-5 text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Education</p>
            <p className="mt-1 font-semibold">Adamson University, Manila, PH</p>
            <p className="text-muted">{m.program}{m.year_level ? `, ${m.year_level}` : ""}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Mentoring subjects</p>
            <p className="mt-1">{(subs[m.id] ?? []).map(subjectName).join(" • ")}</p>
          </div>
          {m.academic_experience ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Academic experience</p>
              <p className="mt-1 whitespace-pre-line">{m.academic_experience}</p>
            </div>
          ) : null}
          {m.skills_achievements ? (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Skills & achievements</p>
              <p className="mt-1 whitespace-pre-line">{m.skills_achievements}</p>
            </div>
          ) : null}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">Mentoring experience</p>
            <p className="mt-1">Verified Peer Mentor at Klasmeyt Adamson.{m.vouched_by ? ` Vouched by ${m.vouched_by}.` : ""}</p>
          </div>
        </div>
      </Card>
    </>
  );
}
