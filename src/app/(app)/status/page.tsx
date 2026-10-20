import Link from "next/link";
import { Check, Clock, XCircle } from "lucide-react";
import { requireMe } from "@/lib/auth";
import { Button, Card, PageHeader } from "@/components/ui";
import { DocList, signDocs } from "@/components/doc-list";
import { Reupload } from "@/components/reupload";
import type { Doc } from "@/lib/types";
import { cn, fmtDateTime } from "@/lib/utils";

export const metadata = { title: "Application status" };

export default async function StatusPage() {
  const { supabase, profile, verification } = await requireMe();
  const status = verification?.status ?? "submitted";
  const isMentor = profile.role === "mentor";
  const { data: docs } = await supabase.from("documents").select("*").eq("owner_id", profile.id).order("uploaded_at", { ascending: false });
  const urls = await signDocs(supabase, (docs ?? []) as Doc[]);
  const hasDocs = (docs ?? []).length > 0;

  // checklist state: done | current | todo | blocked. Once verified, every step is done (seeded accounts may have no files).
  const verified = status === "verified";
  const reviewState = verified ? "done" : status === "rejected" || status === "info_requested" ? "blocked" : hasDocs ? "current" : "todo";
  const steps = [
    { title: "Documents uploaded", body: isMentor ? "Student ID or COR, grades, and CV." : "COE and Student ID.", state: verified || hasDocs ? "done" : "current" },
    ...(isMentor ? [{ title: "Privacy notice accepted", body: "Consent under the Data Privacy Act (RA 10173).", state: verified || profile.privacy_consent_at ? "done" : "todo" }] : []),
    {
      title: "Reviewed by an administrator",
      body: status === "under_review" ? "An administrator is reviewing your documents now." : status === "info_requested" ? "The administrator needs something else from you. See the note below." : status === "rejected" ? "Not approved. See the note below." : "An administrator checks each file.",
      state: reviewState,
    },
    { title: isMentor ? "Approved as a mentor" : "Account verified", body: isMentor ? "Mentees can find you, and your mentor tools unlock." : "Find a mentor unlocks.", state: verified ? "done" : "todo" },
  ];

  const heading =
    verified ? (isMentor ? "Application approved" : "Account verified")
    : status === "rejected" ? (isMentor ? "Application not approved" : "Verification not approved")
    : status === "info_requested" ? "More information needed"
    : isMentor ? "Application submitted" : "Verification in progress";
  // Pending mentors see this page without the app's page header, so the card heading is the page's h1.
  const Heading = isMentor && !verified ? "h1" : "h2";

  const body = (
    <div className="space-y-6">
      <Card className="mx-auto max-w-xl border-dashed border-brand-300 p-8 text-center">
        <span className={cn("mx-auto grid size-12 place-items-center rounded-full", status === "rejected" ? "bg-red-50 text-red-500" : status === "verified" ? "bg-brand-50 text-brand-600" : "bg-pad-50 text-pad-500")}>
          {status === "rejected" ? <XCircle className="size-6" /> : status === "verified" ? <Check className="size-6" /> : <Clock className="size-6" />}
        </span>
        <Heading className="display mt-4 text-[34px] text-brand-800">{heading}</Heading>

        <ol className="mx-auto mt-6 max-w-sm space-y-4 text-left">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-xs font-medium",
                  s.state === "done" && "bg-brand-600 text-white",
                  s.state === "current" && "bg-pad-500 text-white",
                  s.state === "blocked" && "bg-red-500 text-white",
                  s.state === "todo" && "bg-slate-100 text-slate-400"
                )}
              >
                {s.state === "done" ? <Check className="size-3" strokeWidth={3} aria-hidden /> : i + 1}
                <span className="sr-only">{s.state === "done" ? " (done)" : s.state === "current" ? " (in progress)" : s.state === "blocked" ? " (needs attention)" : " (not yet)"}</span>
              </span>
              <span>
                <span className={cn("block text-sm font-semibold", s.state === "todo" ? "text-slate-500" : "text-brand-800")}>{s.title}</span>
                <span className={cn("block text-xs", s.state === "todo" ? "text-slate-500" : "text-muted")}>{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        {verification?.reviewer_note && status !== "verified" ? (
          <div className={cn("mt-6 rounded-control p-3 text-left text-sm", status === "rejected" ? "bg-red-50 text-red-800" : "bg-pad-50 text-pad-800")}>
            <span className="font-semibold">Note from the administrator:</span> {verification.reviewer_note}
          </div>
        ) : null}

        <div className="mt-6 rounded-control border border-brand-200 bg-brand-50/60 p-3 text-left text-xs text-ink">
          {status === "verified" ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{isMentor ? "You're a verified mentor. Mentees can now find you." : "You're verified. You can now find a mentor."}</span>
              <Button asChild size="sm" variant="primary"><Link href={isMentor ? "/dashboard" : "/find"}>{isMentor ? "Open mentor portal" : "Find a mentor"}</Link></Button>
            </div>
          ) : (
            <>You&rsquo;ll get a notification in Klasmeyt when your {isMentor ? "application" : "documents"} are reviewed. You can check this page anytime.</>
          )}
        </div>
        {verification?.reviewed_at ? <p className="mt-3 text-[11px] text-muted">Last reviewed {fmtDateTime(verification.reviewed_at)}</p> : null}
      </Card>

      <Card className="mx-auto max-w-xl p-6">
        <h2 className="font-semibold text-brand-800">Your documents</h2>
        <p className="mb-3 text-xs text-muted">Only you and Klasmeyt administrators can open these.</p>
        <DocList docs={(docs ?? []) as Doc[]} urls={urls} />
        {status !== "verified" ? (
          <div className="mt-6 border-t border-line pt-6">
            <h3 className="mb-3 text-sm font-semibold">{status === "info_requested" ? "Upload the requested document" : "Upload another document"}</h3>
            <Reupload uid={profile.id} types={isMentor ? ["student_id", "academic_record", "cv"] : ["coe", "student_id"]} />
          </div>
        ) : null}
      </Card>
    </div>
  );

  if (isMentor && status !== "verified") return body;
  return (
    <>
      <PageHeader title="Verification status" description="Only verified mentees can search for mentors and send requests." />
      {body}
    </>
  );
}
