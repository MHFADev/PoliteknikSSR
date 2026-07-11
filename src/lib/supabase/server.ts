/*
 * server.ts — Supabase Client untuk Server
 * ==========================================
 * Membuat 2 jenis Supabase client untuk digunakan di Server Component,
 * Server Action, dan Route Handler:
 *
 * 1. createClient() — client dengan anon key, session berdasarkan cookie request
 * 2. createAdminClient() — client dengan service role key, bypass RLS
 *
 * Alur:
 * - createClient: membaca cookie dari request, membuat server client,
 *   dengan cookie handler yang bisa read/write/remove cookie.
 * - createAdminClient: membuat client langsung dengan service_role key,
 *   tanpa session cookie (autoRefreshToken: false).
 *
 * Keputusan teknis:
 * - Setiap request harus buat instance baru karena dependency pada cookies()
 * - try/catch pada set/remove cookie: jika dipanggil dari Server Component
 *   (bukan Server Action/Route Handler), set cookie akan throw — aman diabaikan
 *   karena middleware akan refresh session
 * - createAdminClient menggunakan SUPABASE_SERVICE_ROLE_KEY (env Server-only)
 *   — JANGAN diimpor dari Client Component!
 * - autoRefreshToken & persistSession dimatikan untuk admin client
 *   karena token service role tidak perlu sesi browser
 */

import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * createClient — Supabase client untuk Server Component / Action / Route Handler
 * Bergantung pada cookies() dari request yang sedang diproses.
 *
 * @returns SupabaseClient dengan anon key & session dari cookie
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Aman diabaikan — jika dipanggil dari Server Component,
            // session tetap di-refresh oleh middleware
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Sama seperti di atas
          }
        },
      },
    }
  );
}

/**
 * createAdminClient — Supabase client dengan service role (bypass RLS)
 * HANYA dipakai di Server Action tertentu yang butuh hak akses admin
 * (misal: membuat user baru dari panel Admin).
 *
 * PERINGATAN: JANGAN pernah diimpor dari Client Component!
 *
 * @returns SupabaseClient dengan service_role key
 */
export function createAdminClient() {
  return createSupabaseJsClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
