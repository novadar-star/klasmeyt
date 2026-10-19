import { BadgeCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const tone = {
  teal: "text-teal-700 ring-teal-600 bg-white",
  navy: "text-brand-700 ring-brand-300 bg-white",
  amber: "text-amber-600 ring-amber-400 bg-amber-50/40",
  red: "text-red-600 ring-red-300 bg-red-50/40",
  gray: "text-slate-500 ring-slate-300 bg-white",
  violet: "text-violet-700 ring-violet-300 bg-white",
  solidAmber: "text-white ring-amber-500 bg-amber-500",
};
export type Tone = keyof typeof tone;

export function Badge({ children, color = "teal", className }: { children: React.ReactNode; color?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset", tone[color], className)}>
      {children}
    </span>
  );
}

const V: Record<string, [string, Tone]> = {
  submitted: ["Documents submitted", "gray"],
  pending: ["Pending", "amber"],
  under_review: ["Admin review", "violet"],
  verified: ["Verified", "teal"],
  info_requested: ["More info requested", "red"],
  rejected: ["Rejected", "red"],
};
export function VerificationBadge({ status, kind }: { status: string; kind?: string }) {
  const [label, c] = V[status] ?? [status, "gray"];
  return <Badge color={c}>{status === "verified" && kind === "mentor" ? "Approved" : label}</Badge>;
}
export const verificationLabel = (s: string) =>
  ({ submitted: "Documents submitted", pending: "Pending verification", under_review: "Administrator review", verified: "Verified", info_requested: "Additional information requested", rejected: "Rejected" })[s] ?? s;

export function VerifiedMentorBadge() {
  return (
    <Badge color="teal">
      <BadgeCheck className="size-3" aria-hidden /> Verified Falcon Mentor
    </Badge>
  );
}

export function VouchedBadge({ by }: { by: string | null }) {
  if (!by) return null;
  return (
    <Badge color="amber">
      <ShieldCheck className="size-3" aria-hidden /> Vouched by {by}
    </Badge>
  );
}

const S: Record<string, [string, Tone]> = {
  pending: ["Pending", "amber"],
  scheduled: ["Scheduled", "navy"],
  completed: ["Completed", "teal"],
  cancelled: ["Cancelled", "gray"],
  accepted: ["Partnership accepted", "teal"],
  declined: ["Declined", "red"],
  confirmed: ["Confirmed", "teal"],
  invited: ["Group invite", "violet"],
  active: ["Active", "teal"],
  left: ["Left", "gray"],
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const [l, c] = S[status] ?? [status, "gray"];
  return <Badge color={c}>{label ?? l}</Badge>;
}
