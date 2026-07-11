/*
 * actions.ts — Login Action
 * ==========================================
 * Server action untuk autentikasi login via email & password.
 *
 * Alur:
 * - Terima email + password dari form login
 * - Panggil Repositories.users().signIn() yang menangani:
 *   - Autentikasi via Supabase Auth
 *   - Cek status approved user
 *   - Blokir jika akun belum disetujui admin
 * - Jika sukses → return success (middleware akan redirect ke dashboard)
 *
 * Keamanan:
 * - Tidak mengungkap detail error (selalu "Email atau kata sandi salah")
 *   untuk mencegah user enumeration, kecuali untuk status approval
 *   yang informasinya tidak sensitif
 */

"use server";

import { Repositories } from "@/lib/repositories";

/**
 * signInWithPassword — Login dengan email dan password
 * @param email - Email user
 * @param password - Password user
 * @returns Object { success } atau { error }
 */
export async function signInWithPassword(email: string, password: string) {
  const result = await Repositories.users().signIn(email, password);
  if (result.error) return { error: result.error };
  return { success: true };
}
