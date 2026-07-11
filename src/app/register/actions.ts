/*
 * actions.ts — Server Action untuk Pendaftaran Pengguna
 * ======================================================
 * Berisi fungsi-fungsi yang dijalankan di server untuk:
 * - Mendaftarkan pengguna baru (register)
 * - Menyetujui pengguna yang menunggu persetujuan (approveUser)
 * - Menolak/menghapus pengguna (rejectUser)
 * - Mendapatkan daftar pengguna yang menunggu persetujuan (getPendingUsers)
 *
 * Perubahan:
 * - Seluruh fungsi sekarang menggunakan Repository Layer
 * - register menggunakan UserRepository.signUp()
 * - approveUser/rejectUser/getPendingUsers menggunakan UserRepository
 */

"use server";

import { Repositories } from "@/lib/repositories";
import { validateEmail } from "@/lib/email-validation";
import { revalidatePath } from "next/cache";

/**
 * register — Mendaftarkan pengguna baru ke sistem
 *
 * Alur:
 * 1. Validasi email menggunakan validateEmail
 * 2. Panggil UserRepository.signUp dengan data pendaftaran
 * 3. User akan terdaftar dengan status belum disetujui (approved: false)
 * 4. Admin perlu menyetujui user sebelum bisa login
 *
 * @param fullName - Nama lengkap pengguna
 * @param email - Alamat email (wajib Gmail)
 * @param password - Kata sandi (min 6 karakter — divalidasi oleh Supabase)
 * @param role - Peran: 'siswa' | 'pembimbing'
 * @returns { success: true } atau { error: string }
 */
export async function register(
  fullName: string,
  email: string,
  password: string,
  role: "siswa" | "pembimbing"
) {
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return { error: emailValidation.error || "Email tidak valid." };
  }

  const result = await Repositories.users().signUp({
    email,
    password,
    fullName,
    role: role as "siswa" | "pembimbing",
  });

  if (result.error) {
    return { error: result.error };
  }

  return { success: true };
}

/**
 * approveUser — Menyetujui pengguna yang menunggu persetujuan
 *
 * Menggunakan UserRepository.approveUser() yang memanfaatkan
 * service role untuk memperbarui metadata pengguna.
 *
 * @param userId - UUID pengguna dari Supabase Auth
 * @returns { success: true } atau { error: string }
 */
export async function approveUser(userId: string) {
  const result = await Repositories.users().approveUser(userId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

/**
 * rejectUser — Menolak dan menghapus pengguna yang mendaftar
 *
 * Menggunakan UserRepository.rejectUser() yang memanfaatkan
 * service role untuk menghapus akun pengguna dari Auth.
 *
 * @param userId - UUID pengguna dari Supabase Auth
 * @returns { success: true } atau { error: string }
 */
export async function rejectUser(userId: string) {
  const result = await Repositories.users().rejectUser(userId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

/**
 * getPendingUsers — Mendapatkan daftar pengguna yang menunggu persetujuan
 *
 * Menggunakan UserRepository.getPendingUsers() yang mengambil
 * data dari Auth API dan tabel profiles.
 *
 * @returns Array [{ id, email, fullName, role, createdAt }] atau { error: string }
 */
export async function getPendingUsers(): Promise<
  | { id: string; email: string; fullName: string; role: string; createdAt: string }[]
  | { error: string }
> {
  try {
    return await Repositories.users().getPendingUsers();
  } catch (err) {
    return { error: "Terjadi kesalahan saat mengambil daftar pengguna." };
  }
}
