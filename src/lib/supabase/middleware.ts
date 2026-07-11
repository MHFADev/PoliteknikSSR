/*
 * middleware.ts — Supabase Session Middleware (untuk Next.js Middleware)
 * ==========================================
 * Helper untuk refresh sesi Supabase di setiap request.
 * Dipanggil dari src/middleware.ts (Next.js Middleware).
 *
 * Alur:
 * 1. Buat response object awal
 * 2. Buat Supabase server client dengan cookie handler dari request/response
 * 3. Panggil getUser() untuk refresh token jika expired
 * 4. Kembalikan { response, user, supabase } untuk dipakai di middleware utama
 *
 * Keputusan teknis:
 * - Cookie set/remove harus memodifikasi BUKAN request.cookies asli, melainkan
 *   membuat response baru dengan cookie terupdate — ini pola resmi dari Supabase SSR
 * - Dipisah dari server.ts agar bisa dipakai di Edge Runtime (Next.js middleware)
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

/**
 * updateSession — Refresh sesi Supabase dan sediakan response dengan cookie terupdate
 * @param request - NextRequest dari middleware
 * @returns Object { response (dengan cookie baru), user, supabase }
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // --- Buat Supabase client dengan cookie handler untuk request/response ---
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  // --- Refresh session (memanggil getUser akan auto-refresh token jika perlu) ---
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user, supabase };
}
