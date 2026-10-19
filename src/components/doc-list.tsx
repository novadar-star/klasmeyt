import { ExternalLink, FileText } from "lucide-react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DOC_LABEL, type Doc } from "@/lib/types";
import { fmtDate } from "@/lib/utils";

export async function signDocs(supabase: SupabaseClient, docs: Doc[]) {
  if (!docs.length) return {} as Record<string, string>;
  const { data } = await supabase.storage.from("documents").createSignedUrls(docs.map((d) => d.path), 60 * 30);
  const map: Record<string, string> = {};
  data?.forEach((d) => {
    if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
  });
  return map;
}

export function DocList({ docs, urls }: { docs: Doc[]; urls: Record<string, string> }) {
  if (!docs.length) return <p className="text-sm text-muted">No documents uploaded yet.</p>;
  return (
    <ul className="space-y-2">
      {docs.map((d) => (
        <li key={d.id} className="flex items-center gap-3 rounded-lg border border-line bg-paper px-3 py-2.5">
          <FileText className="size-5 shrink-0 text-teal-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-700">{DOC_LABEL[d.type]}</p>
            <p className="truncate text-[11px] text-muted">{d.file_name} · {fmtDate(d.uploaded_at)}</p>
          </div>
          {urls[d.path] ? (
            <a href={urls[d.path]} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-teal-700 hover:bg-teal-50">
              Open <ExternalLink className="size-3" />
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
