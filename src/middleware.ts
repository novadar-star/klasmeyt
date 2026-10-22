import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC = ["/", "/login", "/signup", "/signup/mentee", "/signup/mentor", "/forgot-password", "/auth/callback"];

export async function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  let response = NextResponse.next({ request: { headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    // Misconfigured deployment: let pages render instead of a 500 on every route.
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return response;
  }

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.includes(path);

  try {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers } });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && !isPublic) {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      to.searchParams.set("next", path);
      return NextResponse.redirect(to);
    }
    if (user && (path === "/login" || path === "/signup")) {
      const to = request.nextUrl.clone();
      to.pathname = "/dashboard";
      to.search = "";
      return NextResponse.redirect(to);
    }
  } catch (e) {
    console.error("middleware auth check failed", e);
    if (!isPublic) {
      const to = request.nextUrl.clone();
      to.pathname = "/login";
      to.search = "";
      return NextResponse.redirect(to);
    }
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
