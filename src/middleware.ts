import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROLE_ROUTES: Record<string, "siswa" | "pembimbing" | "admin"> = {
  "/dashboard/siswa": "siswa",
  "/dashboard/pembimbing": "pembimbing",
  "/dashboard/admin": "admin",
};

function dashboardPathFor(role: string | undefined) {
  switch (role) {
    case "admin": return "/dashboard/admin";
    case "pembimbing": return "/dashboard/pembimbing";
    default: return "/dashboard/siswa";
  }
}

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/_next") || pathname.includes(".");

  if (isApiRoute) return response;

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    return NextResponse.redirect(new URL(dashboardPathFor(profile?.role), request.url));
  }

  if (user && isProtectedRoute) {
    const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) => pathname.startsWith(prefix));
    if (matchedPrefix) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== ROLE_ROUTES[matchedPrefix]) {
        return NextResponse.redirect(new URL(dashboardPathFor(profile?.role), request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
