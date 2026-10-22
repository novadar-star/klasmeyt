import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Landing point for links in Supabase emails (confirm sign-up, reset password, change email).
 * Handles both the PKCE `code` flow and the `token_hash` flow, then sends the user on.
 * `next` is restricted to same-site paths so the link can't be used as an open redirect.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const rawNext = url.searchParams.get("next") ?? "/dashboard";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("\\") ? rawNext : "/dashboard";

  const supabase = createClient();
  let ok = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  const to = url.clone();
  to.search = "";
  if (ok) {
    to.pathname = type === "recovery" ? "/reset-password" : next;
  } else {
    to.pathname = "/login";
    to.searchParams.set("error", "link");
  }
  return NextResponse.redirect(to);
}
