// ============================================================
// ILogbookRepository — Interface Repository untuk Logbook
// ============================================================
// Menangani catatan kegiatan harian siswa (logbook PKL).
//
// Aturan bisnis:
// - 1 entri per siswa per tanggal (upsert)
// - Hanya pembimbing/admin yang bisa memberi nilai
// - Siswa tidak bisa mengubah entri yang sudah dinilai
// ============================================================

import type { LogbookEntry } from "../types";

export interface ILogbookRepository {
  /**
   * upsertEntry — Buat atau update entri logbook untuk hari tertentu
   * @param studentId — UUID siswa
   * @param entryDate — Tanggal entri (YYYY-MM-DD)
   * @param activity — Deskripsi kegiatan
   * @param photoUrl — URL foto pendukung (opsional)
   * @returns ID entri atau error
   */
  upsertEntry(
    studentId: string,
    entryDate: string,
    activity: string,
    photoUrl?: string
  ): Promise<{ id?: string; error?: string }>;

  /**
   * gradeEntry — Beri nilai pada entri logbook siswa
   * @param id — UUID entri
   * @param grade — Nilai (0-100)
   * @param feedback — Catatan/feedback (opsional)
   * @param gradedBy — UUID pembimbing yang menilai
   */
  gradeEntry(
    id: string,
    grade: number,
    feedback?: string,
    gradedBy?: string
  ): Promise<{ error?: string }>;

  /**
   * getEntriesByStudent — Ambil entri milik siswa (opsional filter tanggal)
   * @param studentId — UUID siswa
   * @param start — Tanggal awal filter (opsional, YYYY-MM-DD)
   * @param end — Tanggal akhir filter (opsional, YYYY-MM-DD)
   * @returns Array entri logbook
   */
  getEntriesByStudent(
    studentId: string,
    start?: string,
    end?: string
  ): Promise<LogbookEntry[]>;

  /**
   * getEntriesByMentor — Ambil entri dari semua siswa bimbingan
   * @param mentorId — UUID pembimbing
   * @returns Array entri siswa bimbingan
   */
  getEntriesByMentor(mentorId: string): Promise<LogbookEntry[]>;

  /**
   * getPendingGrading — Ambil entri yang belum dinilai (untuk pembimbing)
   * @param mentorId — UUID pembimbing
   * @returns Array entri tanpa nilai
   */
  getPendingGrading(mentorId: string): Promise<LogbookEntry[]>;

  /**
   * getAllEntries — Ambil semua entri (admin) dengan filter opsional
   * @param filters — Filter studentId dan/atau status penilaian
   * @returns Array entri logbook
   */
  getAllEntries(
    filters?: { studentId?: string; graded?: boolean }
  ): Promise<LogbookEntry[]>;

  /**
   * getUploadUrl — Dapatkan URL untuk upload foto logbook
   * @param studentId — UUID siswa
   * @param entryDate — Tanggal entri
   * @returns Public URL untuk upload, atau null jika gagal
   */
  getUploadUrl(studentId: string, entryDate: string): Promise<string | null>;
}
