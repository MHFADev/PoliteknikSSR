// ============================================================
// IAnnouncementRepository — Interface Repository untuk Pengumuman
// ============================================================
// Menangani broadcast pengumuman dari admin ke siswa.
//
// Dua mode broadcast:
// 1. broadcastToAll = true → semua siswa menerima
// 2. broadcastToAll = false → hanya siswa di studyProgramIds tertentu
// ============================================================

import type { Announcement, CreateAnnouncementInput } from "../types";

export interface IAnnouncementRepository {
  /**
   * getAll — Ambil semua pengumuman
   * @returns Array pengumuman
   */
  getAll(): Promise<Announcement[]>;

  /**
   * getForStudent — Ambil pengumuman yang relevan untuk siswa
   * @param studentId — UUID siswa
   * @param jurusanId — UUID program studi siswa
   * @returns Array pengumuman (broadcast + spesifik jurusan)
   */
  getForStudent(studentId: string, jurusanId: string): Promise<Announcement[]>;

  /**
   * create — Buat pengumuman baru
   * @param input — Data pengumuman (CreateAnnouncementInput)
   *              studyProgramIds diabaikan jika broadcastToAll = true
   * @returns ID pengumuman atau error
   */
  create(input: CreateAnnouncementInput): Promise<{ id?: string; error?: string }>;

  /**
   * delete — Hapus pengumuman
   * @param id — UUID pengumuman
   */
  delete(id: string): Promise<{ error?: string }>;
}
