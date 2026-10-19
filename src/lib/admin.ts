import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, Verification } from "@/lib/types";

export type ApplicantRow = Verification & { profile: Profile };
export const OPEN_STATUSES = ["submitted", "pending", "under_review", "info_requested"];

export async function applicants(supabase: SupabaseClient, kind: "mentor" | "mentee") {
  const { data: v } = await supabase.from("verifications").select("*").eq("kind", kind).order("updated_at", { ascending: false });
  const ids = (v ?? []).map((x) => x.user_id);
  const { data: p } = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
  const map = Object.fromEntries((p ?? []).map((x: Profile) => [x.id, x]));
  return (v ?? []).filter((x) => map[x.user_id]).map((x) => ({ ...x, profile: map[x.user_id] })) as ApplicantRow[];
}
