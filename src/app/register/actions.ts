/*
 * actions.ts — Server Action untuk Pendaftaran Pengguna
 * ======================================================
 * Berisi fungsi-fungsi yang dijalankan di server untuk:
 * - Mendaftarkan pengguna baru (register)
 * - Menyetujui pengguna yang menunggu persetujuan (approveUser)
 * - Menolak/menghapus pengguna (rejectUser)
 * - Mendapatkan daftar pengguna yang menunggu persetujuan (getPendingUsers)
 *
 * Keamanan:
 * - register menggunakan createClient (anon key) — aman untuk form publik
 * - approveUser / rejectUser / getPendingUsers menggunakan createAdminClient
 *   (service role) — HANYA boleh dipanggil dari panel Admin!
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateEmail } from "@/lib/email-validation";

/**
 * register — Mendaftarkan pengguna baru ke sistem
 *
 * Alur:
 * 1. Validasi email menggunakan validateEmail
 * 2. Panggil supabase.auth.signUp dengan metadata (full_name, role)
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
  try {
    // Validasi email sebelum diproses
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      return { error: emailValidation.error || "Email tidak valid." };
    }

    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: "Terjadi kesalahan. Silakan coba lagi." };
  }
}

/**
 * approveUser — Menyetujui pengguna yang menunggu persetujuan
 *
 * Menggunakan createAdminClient (service role) untuk memperbarui
 * metadata pengguna dan menandai sebagai 'approved: true'.
 *
 * @param userId - UUID pengguna dari Supabase Auth
 * @returns { success: true } atau { error: string }
 */
export async function approveUser(userId: string) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { approved: true },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: "Terjadi kesalahan saat menyetujui pengguna." };
  }
}

/**
 * rejectUser — Menolak dan menghapus pengguna yang mendaftar
 *
 * Menggunakan createAdminClient (service role) untuk menghapus
 * akun pengguna dari Auth.
 *
 * @param userId - UUID pengguna dari Supabase Auth
 * @returns { success: true } atau { error: string }
 */
export async function rejectUser(userId: string) {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { error: "Terjadi kesalahan saat menolak pengguna." };
  }
}

/**
 * getPendingUsers — Mendapatkan daftar pengguna yang menunggu persetujuan
 *
 * Alur:
 * 1. Ambil semua user dari Auth menggunakan service role
 * 2. Filter user yang belum disetujui (approved !== true)
 * 3. Ambil profil dari tabel 'profiles' untuk setiap user
 * 4. Kembalikan array dengan data yang sudah diformat
 *
 * @returns Array [{ id, email, fullName, role, createdAt }] atau { error: string }
 */
export async function getPendingUsers(): Promise<
  | { id: string; email: string; fullName: string; role: string; createdAt: string }[]
  | { error: string }
> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.listUsers();

    if (error) {
      return { error: error.message };
    }

    // Filter user yang belum disetujui
    const pendingUsers = data.users.filter(
      (user) => user.user_metadata?.approved !== true
    );

    // Ambil profil dari tabel profiles untuk setiap user pending
    const result: {
      id: string;
      email: string;
      fullName: string;
      role: string;
      createdAt: string;
    }[] = [];

    for (const user of pendingUsers) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      result.push({
        id: user.id,
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name || profile?.full_name || "",
        role: user.user_metadata?.role || profile?.role || "",
        createdAt: user.created_at ?? "",
      });
    }

    return result;
  } catch (err) {
    return { error: "Terjadi kesalahan saat mengambil daftar pengguna." };
  }
}
