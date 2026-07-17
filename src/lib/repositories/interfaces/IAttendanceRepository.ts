// ============================================================
// IAttendanceRepository — Interface Repository untuk Presensi
// ============================================================
// Menangani sesi QR presensi dan record hasil scan siswa.
//
// Alur presensi:
// 1. Admin membuat sesi QR (createSession)
// 2. Siswa scan QR → verifikasi token (verifyAndRecordAttendance)
// 3. Admin/Pembimbing lihat rekap (getRecordsBySession / getRecordsByStudent)
// ============================================================

import type {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
} from "../types";

export interface IAttendanceRepository {
  /**
   * getTodaySession — Ambil sesi presensi untuk hari ini
   * @returns Sesi hari ini, atau null jika belum dibuat
   */
  getTodaySession(): Promise<AttendanceSession | null>;

  /**
   * createSession — Buat sesi presensi baru (QR token)
   * @param sessionDate — Tanggal sesi (YYYY-MM-DD)
   * @param token — Token QR terenkripsi
   * @param createdBy — UUID admin pembuat
   * @returns Sesi yang baru dibuat
   */
  createSession(
    sessionDate: string,
    token: string,
    createdBy: string
  ): Promise<AttendanceSession>;

  /**
   * verifyAndRecordAttendance — Verifikasi token QR & catat presensi
   * @param scannedToken — Token dari QR yang di-scan siswa
   * @param studentId — UUID siswa yang melakukan scan
   * @returns Status presensi (hadir / telat) atau error
   */
  verifyAndRecordAttendance(
    scannedToken: string,
    studentId: string,
    clientTime?: Date
  ): Promise<{ status: AttendanceStatus; error?: string }>;

  /**
   * getRecordsByStudent — Ambil riwayat presensi siswa dalam rentang tanggal
   * @param studentId — UUID siswa
   * @param start — Tanggal awal (YYYY-MM-DD)
   * @param end — Tanggal akhir (YYYY-MM-DD)
   * @returns Array record presensi
   */
  getRecordsByStudent(
    studentId: string,
    start: string,
    end: string
  ): Promise<{ scannedAt: string; status: string }[]>;

  /**
   * getRecordsBySession — Ambil semua presensi dalam satu sesi
   * @param sessionId — UUID sesi
   * @returns Array record presensi untuk sesi tsb
   */
  getRecordsBySession(sessionId: string): Promise<AttendanceRecord[]>;
}
