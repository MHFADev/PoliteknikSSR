/*
 * middleware.ts — Next.js Middleware (Auth & Role-based Routing)
 * ==========================================
 * Middleware utama yang dijalankan di setiap request ke /dashboard dan /login.
 * Menangani:
 * - Refresh sesi Supabase
 * - Redirect user yang belum login ke halaman login
 * - Redirect user yang sudah login di halaman login ke dashboard-nya
 * - Validasi role-based routing (siswa hanya bisa akses /dashboard/siswa, dll)
 *
 * Alur:
 * 1. Panggil updateSession untuk refresh token & dapatkan user
 * 2. Abaikan asset routes (/_next, file statis)
 * 3. Jika belum login & akses protected → redirect ke /login
 * 4. Jika sudah login & akses /login → redirect ke dashboard sesuai role
 * 5. Jika sudah login & akses route yang bukan role-nya → redirect ke dashboard yang sesuai
 *
 * Keputusan teknis:
 * - Menggunakan path prefix matching (bukan regex) untuk role routing
 * - ROLE_ROUTES map prefix → role, jika tidak cocok, biarkan (untuk sub-routes)
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/** Mapping prefix path dashboard ke role yang diizinkan */
const ROLE_ROUTES: Record<string, ("siswa" | "pembimbing" | "admin" | "owner" | "root")[]> = {
  "/dashboard/siswa": ["siswa"],
  "/dashboard/pembimbing": ["pembimbing"],
  "/dashboard/admin": ["admin", "owner", "root"],
};

/**
 * dashboardPathFor — Tentukan path dashboard berdasarkan role
 * @param role - Role user (siswa, pembimbing, admin)
 * @returns Path dashboard yang sesuai
 */
function dashboardPathFor(role: string | undefined) {
  switch (role) {
    case "root": return "/dashboard/admin";
    case "owner": return "/dashboard/admin";
    case "admin": return "/dashboard/admin";
    case "pembimbing": return "/dashboard/pembimbing";
    default: return "/dashboard/siswa";
  }
}

/**
 * middleware — Handler utama Next.js Middleware
 */
export async function middleware(request: NextRequest) {
  // --- Refresh sesi & dapatkan user ---
  const { response, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname === "/login";
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isApiRoute = pathname.startsWith("/_next") || pathname.includes(".");

  // --- Lewati asset Next.js dan file statis ---
  if (isApiRoute) return response;

  // --- Redirect user yang belum login ke /login ---
  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // --- Redirect user yang sudah login di halaman login ke dashboard ---
  if (user && isAuthRoute) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    return NextResponse.redirect(new URL(dashboardPathFor(profile?.role), request.url));
  }

  // --- Validasi role-based routing ---
  if (user && isProtectedRoute) {
    const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) => pathname.startsWith(prefix));
    if (matchedPrefix) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      // Jika role user tidak sesuai dengan prefix route → redirect
      const allowedRoles = ROLE_ROUTES[matchedPrefix] ?? [];
      if (!allowedRoles.includes(profile?.role as "siswa" | "pembimbing" | "admin" | "owner" | "root")) {
        return NextResponse.redirect(new URL(dashboardPathFor(profile?.role), request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
