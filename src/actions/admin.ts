/*
 * admin.ts — Fungsi Admin (Server Actions)
 * ==========================================
 * Berisi operasi CRUD yang hanya bisa dilakukan oleh role Admin:
 * - Statistik presensi 30 hari
 * - Manajemen akun siswa (tambah siswa baru)
 * - Manajemen program studi
 *
 * Alur:
 * - Seluruh fungsi menggunakan Repository Layer (bukan Supabase langsung)
 * - Repository akan memilih client yang sesuai (admin untuk operasi RLS bypass)
 * - `get30DayAttendanceStats` delegasi ke `Repositories.users().getAttendanceStats()`
 * - `addStudent` delegasi ke `Repositories.users().createUser()`
 * - `ensureStudyProgram` delegasi ke `Repositories.studyProgram().ensure()`
 */

"use server";

import { Repositories } from "@/lib/repositories";
import type { AttendanceStats } from "@/lib/repositories";
export type { AttendanceStats };
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generatePermanentStudentToken } from "@/lib/qr-token";

interface AddStudentArgs {
  fullName: string;
  email: string;
  password: string;
  identityNumber?: string;
  instansi?: string;
  kelas?: string;
  jurusanId?: string;
}

/**
 * get30DayAttendanceStats — Ambil statistik presensi 30 hari terakhir
 * @param filters.studentId - Filter spesifik per ID siswa
 * @param filters.name - Filter berdasarkan nama (ilike)
 * @param filters.jurusan - Filter berdasarkan jurusan
 * @param filters.kelas - Filter berdasarkan kelas
 * @returns Array AttendanceStats[] berisi rekap per siswa
 */
export async function get30DayAttendanceStats(
  filters?: { studentId?: string; name?: string; jurusan?: string; kelas?: string }
): Promise<AttendanceStats[]> {
  return Repositories.users().getAttendanceStats(filters ?? {});
}

/**
 * addStudent — Buat akun siswa baru (hanya Admin)
 * @param fullName - Nama lengkap siswa
 * @param email - Email untuk login
 * @param password - Password akun
 * @param identityNumber - NIS/NIM (opsional)
 * @param instansi - Instansi (opsional)
 * @param kelas - Kelas (opsional)
 * @param jurusanId - ID program studi (opsional)
 * @returns Object sukses dengan studentId + permanentToken, atau pesan error
 *
 * Alur:
 * 1. Buat user via repository (menggunakan Admin API internal)
 * 2. Generate QR token permanen untuk presensi QR
 * 3. Revalidate path pengguna admin
 */
export async function addStudent({
  fullName,
  email,
  password,
  identityNumber,
  instansi,
  kelas,
  jurusanId,
}: AddStudentArgs): Promise<{ success: true; studentId: string; permanentToken: string } | { success: false; message: string }> {
  const result = await Repositories.users().createUser({
    email,
    password,
    fullName,
    role: "siswa",
    identityNumber,
    instansi,
    kelas,
    jurusanId,
  });

  if (result.error) {
    return { success: false, message: result.error };
  }

  const permanentToken = await generatePermanentStudentToken(result.userId, process.env.QR_SIGNING_SECRET!);

  revalidatePath("/dashboard/admin/pengguna");

  return { success: true, studentId: result.userId, permanentToken };
}

/**
 * ensureStudyProgram — Cari atau buat program studi baru
 * @param nama - Nama program studi
 * @returns ID program studi (baru atau existing), atau null + error message
 */
export async function ensureStudyProgram(
  nama: string
): Promise<{ id: string | null; error?: string }> {
  const result = await Repositories.studyProgram().ensure(nama);
  return { id: result.id ?? null, error: result.error };
}

/**
 * getStudyPrograms — Ambil semua program studi
 * @returns Array program studi
 */
export async function getStudyPrograms(): Promise<
  { id: string; nama: string; kode: string }[]
> {
  return Repositories.studyProgram().getAll();
}

/**
 * createStudyProgram — Buat program studi baru
 * @param nama — Nama program studi
 * @param kode — Kode program studi (opsional, auto jika kosong)
 * @returns ID program studi atau error
 */
export async function createStudyProgram(
  nama: string,
  kode?: string
): Promise<{ id: string | null; error?: string }> {
  const trimmed = nama.trim();
  if (!trimmed) return { id: null, error: "Nama program studi tidak boleh kosong." };

  const supabase = createAdminClient();

  // Cek duplikat case-insensitive
  const { data: existing } = await supabase
    .from("study_programs")
    .select("id")
    .ilike("nama", trimmed)
    .maybeSingle();

  if (existing) return { id: null, error: "Program studi sudah ada." };

  // Generate kode otomatis jika tidak disediakan
  const finalKode = kode
    ? kode.toUpperCase().trim()
    : trimmed
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 10);

  const { data, error } = await supabase
    .from("study_programs")
    .insert({ nama: trimmed, kode: finalKode })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };

  revalidatePath("/dashboard/admin/study-programs");
  return { id: data.id };
}

/**
 * deleteStudyProgram — Hapus program studi
 * @param id — UUID program studi
 */
export async function deleteStudyProgram(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("study_programs")
    .delete()
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/admin/study-programs");
  return { success: true };
}

/**
 * getPendingUsers — Ambil daftar user yang belum disetujui (approved !== true)
 * @returns Array { id, email, fullName, role, createdAt }
 */
export async function getPendingUsers(): Promise<
  { id: string; email: string; fullName: string; role: string; createdAt: string }[]
> {
  return Repositories.users().getPendingUsers();
}

/**
 * approveUser — Setujui pendaftaran user
 * @param userId - ID user (UUID) yang akan disetujui
 * @returns { success: true } jika berhasil, atau { success: false; message } jika gagal
 */
export async function approveUser(
  userId: string
): Promise<{ success: true } | { success: false; message: string }> {
  const result = await Repositories.users().approveUser(userId);
  if (result.error) {
    return { success: false, message: result.error };
  }

  revalidatePath("/dashboard/admin/pengguna");

  return { success: true };
}

/**
 * rejectUser — Tolak pendaftaran user (hapus akun)
 * @param userId - ID user (UUID) yang akan ditolak
 * @returns { success: true } jika berhasil, atau { success: false; message } jika gagal
 */
export async function rejectUser(
  userId: string
): Promise<{ success: true } | { success: false; message: string }> {
  const result = await Repositories.users().rejectUser(userId);
  if (result.error) {
    return { success: false, message: result.error };
  }

  revalidatePath("/dashboard/admin/pengguna");

  return { success: true };
}

/**
 * deleteUser — Hapus akun user (admin)
 */
export async function deleteUser(
  userId: string
): Promise<{ success: true } | { success: false; message: string }> {
  const result = await Repositories.users().deleteUser(userId);
  if (result.error) return { success: false, message: result.error };
  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

/**
 * blockUser — Blokir user (set approved = false)
 */
export async function blockUser(
  userId: string
): Promise<{ success: true } | { success: false; message: string }> {
  const result = await Repositories.users().blockUser(userId);
  if (result.error) return { success: false, message: result.error };
  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

/**
 * unblockUser — Buka blokir user (set approved = true)
 */
export async function unblockUser(
  userId: string
): Promise<{ success: true } | { success: false; message: string }> {
  const result = await Repositories.users().unblockUser(userId);
  if (result.error) return { success: false, message: result.error };
  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

/**
 * updateUserRole — Ganti role user
 */
export async function updateUserRole(
  userId: string,
  role: "siswa" | "pembimbing" | "admin" | "owner" | "root"
): Promise<{ success: true } | { success: false; message: string }> {
  const result = await Repositories.users().updateUserRole(userId, role);
  if (result.error) return { success: false, message: result.error };
  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

/**
 * resetUserPassword — Reset password user (admin/root only)
 * 
 * Pake REST API langsung biar pasti jalan.
 */
export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: "PUT",
      headers: {
        "apikey": process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        "Authorization": `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        email_confirm: true,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[resetPassword] Gagal:", res.status, text);
      return { success: false, message: `Gagal reset password (${res.status})` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("[resetPassword] Error:", err);
    return { success: false, message: err.message || "Gagal reset password" };
  }
}

/**
 * forceLogoutUser — Paksa logout user dari semua sesi (root only)
 *
 * Hanya hapus session, TIDAK ubah password atau data apapun.
 */
export async function forceLogoutUser(
  userId: string
): Promise<{ success: true } | { success: false; message: string }> {
  const supabase = createAdminClient();

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if (profile?.role === "root" || profile?.role === "owner") {
    return { success: false, message: "Tidak dapat logout akun root/owner." };
  }

  try {
    // Hapus sessions via Postgres function (SECURITY DEFINER, bypass RLS)
    const { error } = await (supabase.rpc as any)("delete_user_sessions", { p_user_id: userId });

    if (error) {
      return { success: false, message: "Gagal logout: " + error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message || "Gagal logout user" };
  }
}

/**
 * getSessionCount — Ambil jumlah sesi aktif user (root only)
 */
export async function getSessionCount(
  userId: string
): Promise<{ count: number } | { success: false; message: string }> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) return { success: false, message: "User tidak ditemukan" };

    const lastSignIn = data.user.last_sign_in_at;
    const createdAt = data.user.created_at;
    const isActive = lastSignIn && new Date(lastSignIn).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000;

    return { count: isActive ? 1 : 0 };
  } catch {
    return { success: false, message: "Gagal mendapatkan info sesi" };
  }
}
