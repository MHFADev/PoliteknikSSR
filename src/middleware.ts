import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ROLE_ROUTES: Record<string, ("siswa" | "pembimbing" | "admin" | "owner" | "root")[]> = {
  "/dashboard/siswa": ["siswa"],
  "/dashboard/pembimbing": ["pembimbing"],
  "/dashboard/admin": ["admin", "owner", "root"],
};

function dashboardPathFor(role: string | undefined) {
  switch (role) {
    case "root": return "/dashboard/admin";
    case "owner": return "/dashboard/admin";
    case "admin": return "/dashboard/admin";
    case "pembimbing": return "/dashboard/pembimbing";
    default: return "/dashboard/siswa";
  }
}

export async function middleware(request: NextRequest) {
  let response: NextResponse;
  let user: any = null;
  try {
    const result = await updateSession(request);
    response = result.response;
    user = result.user;
  } catch {
    response = NextResponse.next();
  }
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isProfileRoute = pathname === "/complete-profile";
  const isApiRoute = pathname.startsWith("/_next") || pathname.includes(".");

  if (isApiRoute) return response;

  if (!user && (isProtectedRoute || isProfileRoute)) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  const role = (user?.user_metadata?.role as string | undefined) || "siswa";

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL(dashboardPathFor(role), request.url));
  }

  if (user && isProtectedRoute) {
    const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) => pathname.startsWith(prefix));
    if (matchedPrefix) {
      const allowedRoles = ROLE_ROUTES[matchedPrefix] ?? [];
      if (!allowedRoles.includes(role as any)) {
        return NextResponse.redirect(new URL(dashboardPathFor(role), request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/complete-profile"],
};
