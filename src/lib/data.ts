"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Doc, Slot } from "@/lib/types";

const EXT: Record<string, string> = { "application/pdf": "pdf", "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Validates type/size on the client too; the bucket and a DB constraint enforce the same rules server-side. */
export function checkFile(file: File) {
  if (!EXT[file.type]) return "Upload a PDF, PNG, JPG, or WEBP file.";
  if (file.size > MAX_FILE_BYTES) return "That file is over 10 MB. Choose a smaller file.";
  return null;
}

export async function uploadDoc(supabase: SupabaseClient, uid: string, type: Doc["type"], file: File | Blob, fileName?: string) {
  const ext = EXT[file.type];
  if (!ext) throw new Error("Upload a PDF, PNG, JPG, or WEBP file.");
  if (file.size > MAX_FILE_BYTES) throw new Error("That file is over 10 MB. Choose a smaller file.");
  const path = `${uid}/${type}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("documents").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw error;
  const name = (fileName ?? (file instanceof File ? file.name : `${type}.${ext}`)).slice(0, 200);
  const { error: e2 } = await supabase.from("documents").insert({ owner_id: uid, type, path, file_name: name });
  if (e2) {
    await supabase.storage.from("documents").remove([path]); // don't leave orphaned files
    throw e2;
  }
}

/** Only add/remove what changed. Verified mentors can remove subjects but not add new ones (database policy). */
export async function saveSubjects(supabase: SupabaseClient, uid: string, ids: number[], current: number[]) {
  const toRemove = current.filter((x) => !ids.includes(x));
  const toAdd = ids.filter((x) => !current.includes(x));
  if (toRemove.length) {
    const { error } = await supabase.from("user_subjects").delete().eq("user_id", uid).in("subject_id", toRemove);
    if (error) throw error;
  }
  if (toAdd.length) {
    const { error } = await supabase.from("user_subjects").insert(toAdd.map((subject_id) => ({ user_id: uid, subject_id })));
    if (error) throw new Error(error.code === "42501" ? "Ask an administrator to add a subject. New subjects need proof of your grades." : error.message);
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
