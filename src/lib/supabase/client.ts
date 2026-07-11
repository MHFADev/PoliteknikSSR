/*
 * client.ts — Supabase Client untuk Browser
 * ==========================================
 * Membuat Supabase client yang dipakai di Client Components (use client).
 * Menggunakan `createBrowserClient` dari @supabase/ssr yang mendukung
 * cookie-based session management di browser.
 *
 * Alur:
 * - Hanya dipakai di komponen dengan direktif "use client"
 * - Menggunakan NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY
 * - Diketik dengan tipe Database dari types/database.ts untuk type safety
 *
 * Keputusan teknis:
 * - Pisah dari server.ts karena client browser butuh cookie handling berbeda
 * - createBrowserClient menangani refresh token via cookie secara otomatis
 */

"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * createClient — Buat Supabase client untuk browser
 * @returns SupabaseClient yang sudah diketik dengan tipe Database
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
