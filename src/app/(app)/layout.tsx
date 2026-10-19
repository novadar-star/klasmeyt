import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMe } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

// verified-only pages for mentees
const MENTEE_VERIFIED_ONLY = ["/find", "/mentors"];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe();
  if (!me) redirect("/login");
  const path = headers().get("x-pathname") ?? "";
  const { profile, verified, supabase } = me;

  if (profile.role === "admin" && !path.startsWith("/admin")) redirect("/admin");
  if (profile.role !== "admin" && path.startsWith("/admin")) redirect("/dashboard");
  // Pending mentors only see their application status (FR-A10)
  if (profile.role === "mentor" && !verified && path !== "/status") redirect("/status");
  if (profile.role === "mentee" && !verified && MENTEE_VERIFIED_ONLY.some((p) => path.startsWith(p))) redirect("/status");

  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("read", false);
  const subline = profile.role === "admin" ? "Klasmeyt administrator" : [profile.year_level, profile.program].filter(Boolean).join(" · ");

  return (
    <AppShell
      role={profile.role}
      verified={verified}
      name={profile.full_name}
      subline={subline}
      userId={profile.id}
      unread={count ?? 0}
      bare={profile.role === "mentor" && !verified}
    >
      {children}
    </AppShell>
  );
}
