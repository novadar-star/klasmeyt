import Link from "next/link";
import { Button, Card, Empty } from "@/components/ui";
import { VerificationBadge } from "@/components/badges";
import { daysText, timeText } from "@/components/avail";
import { cn, relTime, subjectName } from "@/lib/utils";
import type { ApplicantRow } from "@/lib/admin";
import type { Slot } from "@/lib/types";

const FILTERS = [
  { v: "", label: "All" },
  { v: "open", label: "Needs review" },
  { v: "verified", label: "Verified" },
  { v: "info_requested", label: "More info requested" },
  { v: "rejected", label: "Rejected" },
];

export function AdminPeople({ rows, base, filter, subs, slots, counts, kind }: { rows: ApplicantRow[]; base: string; filter: string; subs: Record<string, number[]>; slots: Record<string, Slot[]>; counts: Record<string, number>; kind: "mentor" | "mentee" }) {
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link key={f.v} href={f.v ? `${base}?status=${f.v}` : base} className={cn("rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset", filter === f.v ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-brand-700 ring-line hover:ring-brand-300")}>
            {f.label}
          </Link>
        ))}
      </div>
      {rows.length ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line bg-paper text-[10px] font-bold uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Subjects</th>
                <th className="px-4 py-3">Availability</th>
                <th className="px-4 py-3">{kind === "mentor" ? "Mentees" : "Partners"}</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.profile.full_name}</p>
                    <p className="text-xs text-muted">{[r.profile.year_level, r.profile.program].filter(Boolean).join(" • ")}</p>
                  </td>
                  <td className="px-4 py-3 font-medium text-teal-700">{(subs[r.user_id] ?? []).map(subjectName).join(", ") || "—"}</td>
                  <td className="px-4 py-3 text-xs">{daysText(slots[r.user_id])}<br /><span className="text-muted">{timeText(slots[r.user_id])}</span></td>
                  <td className="px-4 py-3 tabular-nums">{counts[r.user_id] ?? 0}</td>
                  <td className="px-4 py-3"><VerificationBadge status={r.status} kind={kind} /><p className="mt-1 text-[11px] text-muted">{relTime(r.updated_at)}</p></td>
                  <td className="px-4 py-3 text-right"><Button asChild size="sm" variant="outline"><Link href={`/admin/users/${r.user_id}`}>Review</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Empty title="Nobody here yet" />
      )}
    </>
  );
}
