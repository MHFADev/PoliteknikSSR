/*
 * actions.ts — Login Action
 * ==========================================
 * Server action untuk autentikasi login via email & password.
 *
 * Alur:
 * - Terima email + password dari form login
 * - Panggil supabase.auth.signInWithPassword
 * - Jika error → return pesan error
 * - Jika sukses, cek status approved user:
 *   - Jika user_metadata.approved === false → tolak login (akun belum disetujui admin)
 *   - Jika user_metadata.approved === true atau undefined (legacy) → izinkan login
 * - Jika sukses → return success (middleware akan redirect ke dashboard)
 *
 * Keamanan:
 * - Tidak mengungkap detail error (selalu "Email atau kata sandi salah")
 *   untuk mencegah user enumeration, kecuali untuk status approval
 *   yang informasinya tidak sensitif
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
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Pesan error generik untuk mencegah user enumeration
    return { error: "Email atau kata sandi salah." };
  }

  // Cek status approved user — blokir jika admin belum menyetujui akun
  // - user_metadata.approved === false → akun baru yang belum disetujui admin
  // - user_metadata.approved === true atau undefined → legacy user, izinkan login
  if (data.user?.user_metadata?.approved === false) {
    // Langsung logout karena akun belum disetujui
    await supabase.auth.signOut();
    return { error: "Akun Anda belum disetujui oleh admin. Silakan tunggu persetujuan." };
  }

  return { success: true };
}
