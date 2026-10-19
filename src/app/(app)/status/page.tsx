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

  // checklist state: done | current | todo | blocked
  const reviewState = status === "verified" ? "done" : status === "rejected" || status === "info_requested" ? "blocked" : hasDocs ? "current" : "todo";
  const steps = [
    { title: "Requirements Submitted", body: isMentor ? "Student ID, academic record, and CV uploaded." : "COE and Student ID uploaded.", state: hasDocs ? "done" : "current" },
    ...(isMentor ? [{ title: "Privacy Notice Accepted", body: "Republic Act No. 10173 data agreement signed.", state: profile.privacy_consent_at ? "done" : "todo" }] : []),
    { title: "Admin Academic Review", body: status === "under_review" ? "An administrator is reviewing your documents now." : "A Klasmeyt administrator verifies your records.", state: reviewState },
    { title: isMentor ? "Mentor Portal Verification" : "Mentee Account Verified", body: isMentor ? "Your Mentor dashboard unlocks once your application is approved." : "Find a Mentor unlocks once you're verified.", state: status === "verified" ? "done" : "todo" },
  ];

  const heading =
    status === "verified" ? (isMentor ? "Application Approved" : "Account Verified")
    : status === "rejected" ? (isMentor ? "Application Not Approved" : "Verification Rejected")
    : status === "info_requested" ? "Additional Information Requested"
    : isMentor ? "Application Submitted" : "Verification Pending";

  const body = (
    <div className="space-y-6">
      <Card className="mx-auto max-w-xl border-dashed border-teal-300 p-8 text-center">
        <span className={cn("mx-auto grid size-12 place-items-center rounded-full", status === "rejected" ? "bg-red-50 text-red-500" : status === "verified" ? "bg-teal-50 text-teal-600" : "bg-amber-50 text-amber-500")}>
          {status === "rejected" ? <XCircle className="size-6" /> : status === "verified" ? <Check className="size-6" /> : <Clock className="size-6" />}
        </span>
        <h1 className="mt-4 text-2xl font-bold text-brand-700">{heading}</h1>
        {status !== "verified" && status !== "rejected" ? (
          <p className="mt-1 text-sm text-muted">Estimated verification wait time: <span className="font-semibold text-ink">1–2 business days</span></p>
        ) : null}

        <ol className="mx-auto mt-6 max-w-sm space-y-4 text-left">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span
                className={cn(
                  "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                  s.state === "done" && "bg-teal-600 text-white",
                  s.state === "current" && "bg-amber-500 text-white",
                  s.state === "blocked" && "bg-red-500 text-white",
                  s.state === "todo" && "bg-slate-100 text-slate-400"
                )}
              >
                {s.state === "done" ? <Check className="size-3" strokeWidth={3} /> : i + 1}
              </span>
              <span>
                <span className={cn("block text-sm font-semibold", s.state === "todo" ? "text-slate-400" : "text-brand-700")}>{s.title}</span>
                <span className={cn("block text-xs", s.state === "todo" ? "text-slate-400" : "text-muted")}>{s.body}</span>
              </span>
            </li>
          ))}
        </ol>

        {verification?.reviewer_note && status !== "verified" ? (
          <div className={cn("mt-6 rounded-lg p-3 text-left text-sm", status === "rejected" ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-900")}>
            <span className="font-semibold">Note from the administrator:</span> {verification.reviewer_note}
          </div>
        ) : null}

        <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50/60 p-3 text-left text-xs text-ink">
          {status === "verified" ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>{isMentor ? "You're a verified mentor. Mentees can now find you." : "You're verified. You can now find a mentor."}</span>
              <Button asChild size="sm" variant="teal"><Link href={isMentor ? "/dashboard" : "/find"}>{isMentor ? "Open mentor portal" : "Find a mentor"}</Link></Button>
            </div>
          ) : (
            <><span className="font-semibold text-teal-700">System Note:</span> You'll get a Klasmeyt notification once your {isMentor ? "application" : "documents"} have been reviewed. Log in again anytime to check this page.</>
          )}
        </div>
        {verification?.reviewed_at ? <p className="mt-3 text-[11px] text-muted">Last reviewed {fmtDateTime(verification.reviewed_at)}</p> : null}
      </Card>

      <Card className="mx-auto max-w-xl p-6">
        <h2 className="font-bold text-brand-700">Your documents</h2>
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
      <PageHeader title="Verification Status" description="Only verified mentees can search for mentors and send partnership requests." />
      {body}
    </>
  );
}
