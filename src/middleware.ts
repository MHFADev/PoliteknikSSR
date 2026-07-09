import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

<<<<<<< HEAD
// Peta prefix rute -> role yang diizinkan.
=======
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
const ROLE_ROUTES: Record<string, "siswa" | "pembimbing" | "admin"> = {
  "/dashboard/siswa": "siswa",
  "/dashboard/pembimbing": "pembimbing",
  "/dashboard/admin": "admin",
};

function dashboardPathFor(role: string | undefined) {
  switch (role) {
<<<<<<< HEAD
    case "admin":
      return "/dashboard/admin";
    case "pembimbing":
      return "/dashboard/pembimbing";
    default:
      return "/dashboard/siswa";
=======
    case "admin": return "/dashboard/admin";
    case "pembimbing": return "/dashboard/pembimbing";
    default: return "/dashboard/siswa";
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  }
}

export async function middleware(request: NextRequest) {
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/dashboard");
<<<<<<< HEAD

  // Belum login tapi mengakses dashboard -> lempar ke login
=======
  const isApiRoute = pathname.startsWith("/_next") || pathname.includes(".");

  if (isApiRoute) return response;

>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

<<<<<<< HEAD
  // Sudah login tapi masih di halaman login -> lempar ke dashboard sesuai role
=======
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    return NextResponse.redirect(new URL(dashboardPathFor(profile?.role), request.url));
  }

<<<<<<< HEAD
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
=======
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
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
    }
  }

  return response;
}

export const config = {
<<<<<<< HEAD
  matcher: [
    /*
     * Jalankan middleware untuk semua path KECUALI:
     * - file statis (_next/static, _next/image)
     * - favicon
     * - folder public (svg, png, dst)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
=======
  matcher: ["/dashboard/:path*", "/login"],
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
};
