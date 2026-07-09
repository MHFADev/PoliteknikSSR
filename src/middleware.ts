import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Peta prefix rute -> role yang diizinkan.
const ROLE_ROUTES: Record<string, "siswa" | "pembimbing" | "admin"> = {
  "/dashboard/siswa": "siswa",
  "/dashboard/pembimbing": "pembimbing",
  "/dashboard/admin": "admin",
};

function dashboardPathFor(role: string | undefined) {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "pembimbing":
      return "/dashboard/pembimbing";
    default:
      return "/dashboard/siswa";
  }
}

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/dashboard");

  // Belum login tapi mengakses dashboard -> lempar ke login
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Sudah login tapi masih di halaman login -> lempar ke dashboard sesuai role
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    return NextResponse.redirect(new URL(dashboardPathFor(profile?.role), request.url));
  }

  // Sudah login & mengakses /dashboard/** -> cek kecocokan role dengan folder yang diakses
  if (user && isProtectedRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) => pathname.startsWith(prefix));

    if (matchedPrefix && profile?.role !== ROLE_ROUTES[matchedPrefix]) {
      // Role tidak cocok dengan folder dashboard yang diminta -> redirect ke dashboard miliknya
      return NextResponse.redirect(new URL(dashboardPathFor(profile?.role), request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Jalankan middleware untuk semua path KECUALI:
     * - file statis (_next/static, _next/image)
     * - favicon
     * - folder public (svg, png, dst)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
