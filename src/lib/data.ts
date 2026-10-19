"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Doc, Slot } from "@/lib/types";

export async function uploadDoc(supabase: SupabaseClient, uid: string, type: Doc["type"], file: File) {
  const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
  const path = `${uid}/${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const { error: e2 } = await supabase.from("documents").insert({ owner_id: uid, type, path, file_name: file.name });
  if (e2) throw e2;
}

export async function saveSubjects(supabase: SupabaseClient, uid: string, ids: number[]) {
  const { error } = await supabase.from("user_subjects").delete().eq("user_id", uid);
  if (error) throw error;
  if (ids.length) {
    const { error: e } = await supabase.from("user_subjects").insert(ids.map((subject_id) => ({ user_id: uid, subject_id })));
    if (e) throw e;
  }
}

export async function saveAvailability(supabase: SupabaseClient, uid: string, slots: Slot[]) {
  const { error } = await supabase.from("availability").delete().eq("user_id", uid);
  if (error) throw error;
  if (slots.length) {
    const { error: e } = await supabase
      .from("availability")
      .insert(slots.map((s) => ({ user_id: uid, day: s.day, start_time: s.start_time, end_time: s.end_time })));
    if (e) throw e;
  }
}
