/*
 * attendance.ts — Proses Presensi Siswa
 * ==========================================
 * Server action untuk submit presensi siswa menggunakan QR token
 * (daily QR dari admin atau permanent QR milik siswa).
 *
 * Alur:
 * - Verifikasi sesi login via Repository
 * - Validasi role siswa dari data user
 * - Delegasi verifikasi QR & pencatatan presensi ke AttendanceRepository
 */

"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";

/**
 * submitAttendance — Proses submit presensi dari hasil scan QR
 * @param scannedToken - Token hasil scan QR (string base64url)
 * @returns Object { success, message } — hasil presensi
 *
 * Alur:
 * 1. Validasi sesi login dan role siswa via UserRepository
 * 2. Delegasi verifikasi QR + pencatatan presensi ke AttendanceRepository
 * 3. Revalidate path dashboard siswa
 */
export async function submitAttendance(scannedToken: string) {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { success: false, message: "Sesi login tidak ditemukan. Silakan login ulang." };
  if (user.role !== "siswa") {
    return { success: false, message: "Hanya akun siswa yang dapat melakukan presensi." };
  }

  const result = await Repositories.attendance().verifyAndRecordAttendance(scannedToken, user.id);
  if (result.error) return { success: false, message: result.error };

  revalidatePath("/dashboard/siswa");
  return { success: true, message: result.status === "hadir" ? "Presensi berhasil — Hadir tepat waktu!" : "Presensi tercatat — Telat." };
}
