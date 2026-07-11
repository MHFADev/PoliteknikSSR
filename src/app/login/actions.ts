/*
 * actions.ts — Login Action
 * ==========================================
 * Server action untuk autentikasi login via email & password.
 *
 * Alur:
 * - Terima email + password dari form login
 * - Panggil supabase.auth.signInWithPassword
 * - Jika error → return pesan error
 * - Jika sukses → return success (middleware akan redirect ke dashboard)
 *
 * Keamanan:
 * - Tidak mengungkap detail error (selalu "Email atau kata sandi salah")
 *   untuk mencegah user enumeration
 */

"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * signInWithPassword — Login dengan email dan password
 * @param email - Email user
 * @param password - Password user
 * @returns Object { success } atau { error }
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Pesan error generik untuk mencegah user enumeration
    return { error: "Email atau kata sandi salah." };
  }
  return { success: true };
}
