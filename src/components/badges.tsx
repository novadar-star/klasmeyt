import { BadgeCheck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Status color is meaning, not decoration:
 *  green = verified/approved · blue = arrangement in place · pad (yellow) = waiting on someone · red = needs action/failed · gray = inactive · neutral = info
 */
const tone = {
  blue: "bg-brand-50 text-brand-700",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  pad: "bg-pad-100 text-pad-800",
  red: "bg-red-50 text-red-700",
  gray: "bg-slate-100 text-slate-600",
  ink: "bg-white text-ink ring-1 ring-inset ring-line",
  solid: "bg-brand-600 text-white",
  // legacy aliases
  teal: "bg-brand-50 text-brand-700",
  navy: "bg-white text-brand-800 ring-1 ring-inset ring-line",
  amber: "bg-pad-100 text-pad-800",
  violet: "bg-white text-ink ring-1 ring-inset ring-line",
  solidAmber: "bg-pad-300 text-pad-800",
};
export type Tone = keyof typeof tone;

export function Badge({ children, color = "blue", className }: { children: React.ReactNode; color?: Tone; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium", tone[color], className)}>
      {children}
    </span>
  );
}

const V: Record<string, [string, Tone]> = {
  submitted: ["Waiting for documents", "gray"],
  pending: ["Needs review", "pad"],
  under_review: ["In review", "pad"],
  verified: ["Verified", "green"],
  info_requested: ["Needs more info", "red"],
  rejected: ["Rejected", "red"],
};
export function VerificationBadge({ status, kind }: { status: string; kind?: string }) {
  const [label, c] = V[status] ?? [status, "gray"];
  return <Badge color={c}>{status === "verified" && kind === "mentor" ? "Approved" : label}</Badge>;
}
export const verificationLabel = (s: string) =>
  ({ submitted: "Waiting for documents", pending: "Pending verification", under_review: "Administrator review", verified: "Verified", info_requested: "Additional information requested", rejected: "Rejected" })[s] ?? s;

export function VerifiedMentorBadge() {
  return (
    <Badge color="solid">
      <BadgeCheck className="size-3.5" aria-hidden /> Verified mentor
    </Badge>
  );
}

export function VouchedBadge({ by }: { by: string | null }) {
  if (!by) return null;
  return (
    <Badge color="ink">
      <ShieldCheck className="size-3.5 text-brand-600" aria-hidden /> Vouched by {by}
    </Badge>
  );
}

const S: Record<string, [string, Tone]> = {
  pending: ["Pending", "pad"],
  not_attending: ["Not attending", "gray"],
  scheduled: ["Scheduled", "blue"],
  completed: ["Completed", "gray"],
  cancelled: ["Cancelled", "gray"],
  expired: ["Not confirmed in time", "gray"],
  accepted: ["Partnership accepted", "blue"],
  declined: ["Declined", "red"],
  confirmed: ["Confirmed", "blue"],
  invited: ["Group invite", "pad"],
  active: ["Active", "blue"],
  left: ["Left", "gray"],
};
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const [l, c] = S[status] ?? [status, "gray"];
  return <Badge color={c}>{label ?? l}</Badge>;
}

/** Session status, worded for sessions: a proposal waits on "Pending confirmation" until everyone answers. */
export function SessionBadge({ status }: { status: string }) {
  return <StatusBadge status={status} label={status === "pending" ? "Pending confirmation" : undefined} />;
}
