import type { SupabaseClient } from "@supabase/supabase-js";
import type { Group, Profile, Session, Slot } from "@/lib/types";

export type Member = { group_id: string; mentee_id: string; status: "invited" | "active" | "left"; joined_at: string | null; invited_at: string };
export type GroupFull = Group & { members: Member[]; mentor?: Profile };
export type Participant = { session_id: string; mentee_id: string; response: "pending" | "confirmed" | "declined" };
export type SessionFull = Session & { participants: Participant[]; group?: Group };

export async function profilesById(supabase: SupabaseClient, ids: string[]) {
  const uniq = Array.from(new Set(ids.filter(Boolean)));
  if (!uniq.length) return {} as Record<string, Profile>;
  const { data } = await supabase.from("profiles").select("*").in("id", uniq);
  return Object.fromEntries((data ?? []).map((p: Profile) => [p.id, p])) as Record<string, Profile>;
}

/** Groups the user mentors or belongs to (any member status). */
export async function myGroups(supabase: SupabaseClient, uid: string, role: Profile["role"]) {
  let groups: Group[] = [];
  if (role === "mentor") {
    const { data } = await supabase.from("mentoring_groups").select("*").eq("mentor_id", uid).order("created_at", { ascending: false });
    groups = data ?? [];
  } else {
    const { data: mine } = await supabase.from("group_members").select("group_id").eq("mentee_id", uid);
    const ids = (mine ?? []).map((m) => m.group_id);
    if (ids.length) {
      const { data } = await supabase.from("mentoring_groups").select("*").in("id", ids).order("created_at", { ascending: false });
      groups = data ?? [];
    }
  }
  const ids = groups.map((g) => g.id);
  const { data: members } = ids.length
    ? await supabase.from("group_members").select("*").in("group_id", ids)
    : { data: [] as Member[] };
  return groups.map((g) => ({ ...g, members: (members ?? []).filter((m: Member) => m.group_id === g.id) })) as GroupFull[];
}

export async function sessionsFor(supabase: SupabaseClient, filter?: { groupId?: string }) {
  let q = supabase.from("sessions").select("*").order("starts_at", { ascending: true });
  if (filter?.groupId) q = q.eq("group_id", filter.groupId);
  const { data: sessions } = await q;
  const ids = (sessions ?? []).map((s) => s.id);
  const { data: parts } = ids.length ? await supabase.from("session_participants").select("*").in("session_id", ids) : { data: [] };
  return (sessions ?? []).map((s) => ({ ...s, participants: (parts ?? []).filter((p: Participant) => p.session_id === s.id) })) as SessionFull[];
}

export async function slotsFor(supabase: SupabaseClient, ids: string[]) {
  if (!ids.length) return {} as Record<string, Slot[]>;
  const { data } = await supabase.from("availability").select("*").in("user_id", ids).order("day").order("start_time");
  const out: Record<string, Slot[]> = {};
  (data ?? []).forEach((s: Slot) => {
    (out[s.user_id!] ??= []).push(s);
  });
  return out;
}

export async function subjectsFor(supabase: SupabaseClient, ids: string[]) {
  if (!ids.length) return {} as Record<string, number[]>;
  const { data } = await supabase.from("user_subjects").select("*").in("user_id", ids);
  const out: Record<string, number[]> = {};
  (data ?? []).forEach((s: { user_id: string; subject_id: number }) => {
    (out[s.user_id] ??= []).push(s.subject_id);
  });
  return out;
}

/** A mentee said "Cannot attend": the session isn't theirs anymore (hidden from their calendar). */
export function notAttending(s: SessionFull, uid: string) {
  return s.participants.some((p) => p.mentee_id === uid && p.response === "declined");
}

export type Window = { day: number; start: string; end: string };

/**
 * The schedule agreed when each partnership was accepted (mentee's hours at request ∩ mentor's at acceptance),
 * per active mentee of each group. Sessions can only be proposed inside the intersection of these.
 */
export async function agreedWindows(supabase: SupabaseClient, groups: GroupFull[]) {
  const out: Record<string, Record<string, Window[]>> = {};
  const mentees = Array.from(new Set(groups.flatMap((g) => g.members.filter((m) => m.status === "active").map((m) => m.mentee_id))));
  const mentors = Array.from(new Set(groups.map((g) => g.mentor_id)));
  if (!mentees.length) return out;
  const { data: reqs } = await supabase
    .from("partnership_requests")
    .select("id,mentee_id,mentor_id,subject_id,responded_at,created_at")
    .eq("status", "accepted")
    .in("mentee_id", mentees)
    .in("mentor_id", mentors)
    .order("responded_at", { ascending: false, nullsFirst: false });
  const reqIds = (reqs ?? []).map((r) => r.id);
  const { data: wins } = reqIds.length ? await supabase.from("agreed_windows").select("*").in("request_id", reqIds) : { data: [] };
  for (const g of groups) {
    out[g.id] = {};
    for (const m of g.members.filter((x) => x.status === "active")) {
      const r = (reqs ?? []).find((x) => x.mentee_id === m.mentee_id && x.mentor_id === g.mentor_id && x.subject_id === g.subject_id);
      out[g.id][m.mentee_id] = r
        ? (wins ?? [])
            .filter((w: { request_id: string }) => w.request_id === r.id)
            .map((w: { day: number; start_time: string; end_time: string }) => ({ day: w.day, start: w.start_time.slice(0, 5), end: w.end_time.slice(0, 5) }))
        : [];
    }
  }
  return out;
}
