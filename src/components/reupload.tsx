"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { uploadDoc } from "@/lib/data";
import { FilePick } from "@/components/form-bits";
import { Button } from "@/components/ui";
import { DOC_LABEL, type Doc } from "@/lib/types";
import { errMsg } from "@/lib/utils";

export function Reupload({ uid, types }: { uid: string; types: Doc["type"][] }) {
  const router = useRouter();
  const [type, setType] = useState<Doc["type"]>(types[0]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!file) return;
    setBusy(true);
    try {
      await uploadDoc(createClient(), uid, type, file);
      toast.success("Document uploaded. Your status is back to pending verification.");
      setFile(null);
      router.refresh();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <select className="field" value={type} onChange={(e) => setType(e.target.value as Doc["type"])} aria-label="Document type">
        {types.map((t) => <option key={t} value={t}>{DOC_LABEL[t]}</option>)}
      </select>
      <FilePick label="Choose a file" file={file} onChange={setFile} />
      <Button onClick={go} disabled={!file || busy}>{busy ? "Uploading…" : "Upload document"}</Button>
    </div>
  );
}
