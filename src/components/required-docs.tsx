"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadDoc } from "@/lib/data";
import { clearPending, loadPending } from "@/lib/pending-docs";
import { FilePick } from "@/components/form-bits";
import { Button } from "@/components/ui";
import { DOC_LABEL, type Doc } from "@/lib/types";
import { errMsg } from "@/lib/utils";

const REQUIRED: Record<"mentee" | "mentor", Doc["type"][]> = {
  mentee: ["coe", "student_id"],
  mentor: ["student_id", "academic_record", "cv"],
};
const LABEL: Partial<Record<Doc["type"], string>> = {
  student_id: "Student ID or Certificate of Registration (COR)",
  academic_record: "Grades for the subjects you'll mentor",
};

/**
 * Checklist of required documents. Files picked during sign-up (kept in this browser until the email was confirmed)
 * upload automatically the first time the student lands here.
 */
export function RequiredDocs({ uid, email, role, uploaded }: { uid: string; email: string; role: "mentee" | "mentor"; uploaded: Doc["type"][] }) {
  const router = useRouter();
  const required = REQUIRED[role];
  const missing = required.filter((t) => !uploaded.includes(t));
  const [files, setFiles] = useState<Partial<Record<Doc["type"], File | null>>>({});
  const [busy, setBusy] = useState<Doc["type"] | "auto" | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !missing.length) return;
    ran.current = true;
    (async () => {
      const pending = (await loadPending(email)).filter((p) => missing.includes(p.type));
      if (!pending.length) return;
      setBusy("auto");
      const supabase = createClient();
      let done = 0;
      for (const p of pending) {
        try {
          await uploadDoc(supabase, uid, p.type, p.blob, p.name);
          await clearPending(email, p.type);
          done++;
        } catch (e) {
          toast.error(`${DOC_LABEL[p.type]}: ${errMsg(e)}`);
        }
      }
      setBusy(null);
      if (done) {
        toast.success(done === pending.length ? "Your sign-up documents were uploaded." : `${done} of ${pending.length} documents uploaded.`);
        router.refresh();
      }
    })();
  }, [email, uid, missing, router]);

  async function upload(type: Doc["type"]) {
    const f = files[type];
    if (!f) return;
    setBusy(type);
    try {
      await uploadDoc(createClient(), uid, type, f);
      await clearPending(email, type);
      setFiles((x) => ({ ...x, [type]: null }));
      toast.success(`${DOC_LABEL[type]} uploaded`);
      router.refresh();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {busy === "auto" ? (
        <p className="flex items-center gap-2 rounded-control bg-brand-50 px-3 py-2 text-sm text-brand-800" role="status">
          <Loader2 className="size-4 animate-spin" aria-hidden /> Uploading the documents you chose when you signed up…
        </p>
      ) : null}
      <ul className="space-y-3">
        {required.map((t) =>
          uploaded.includes(t) ? (
            <li key={t} className="flex items-center gap-2 text-sm text-ink">
              <CheckCircle2 className="size-4 text-brand-600" aria-hidden /> {LABEL[t] ?? DOC_LABEL[t]} <span className="text-muted">uploaded</span>
            </li>
          ) : (
            <li key={t} className="space-y-2">
              <FilePick id={`req-${t}`} label={LABEL[t] ?? DOC_LABEL[t]} file={files[t] ?? null} onChange={(f) => setFiles((x) => ({ ...x, [t]: f }))} required />
              {files[t] ? (
                <Button size="sm" onClick={() => upload(t)} loading={busy === t} disabled={!!busy && busy !== t}>
                  Upload {DOC_LABEL[t]}
                </Button>
              ) : null}
            </li>
          )
        )}
      </ul>
    </div>
  );
}
