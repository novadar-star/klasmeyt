import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Verification } from "@/lib/types";

export async function getMe() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const [{ data: profile }, { data: verification }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single<Profile>(),
    supabase.from("verifications").select("*").eq("user_id", user.id).maybeSingle<Verification>(),
  ]);
  if (!profile) return null;
  return { supabase, user, profile, verification, verified: verification?.status === "verified" };
}

export async function requireMe() {
  const me = await getMe();
  if (!me) redirect("/login");
  return me;
}

export async function requireRole(...roles: Profile["role"][]) {
  const me = await requireMe();
  if (!roles.includes(me.profile.role)) redirect(me.profile.role === "admin" ? "/admin" : "/dashboard");
  return me;
}

/** Mentee or mentor that must be verified to use the page */
export async function requireVerified(...roles: Profile["role"][]) {
  const me = await requireRole(...roles);
  if (!me.verified) redirect("/status");
  return me;
}
