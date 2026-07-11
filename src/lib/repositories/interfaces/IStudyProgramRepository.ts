// ============================================================
// IStudyProgramRepository — Interface Repository untuk Jurusan
// ============================================================
// Menangani data program studi / jurusan dan relasi
// antara siswa dengan pembimbing (student_mentors).
// ============================================================

import type { StudyProgram, StudentMentor } from "../types";

export interface IStudyProgramRepository {
  /**
   * getAll — Ambil semua program studi
   * @returns Array program studi
   */
  getAll(): Promise<StudyProgram[]>;

  /**
   * ensure — Pastikan program studi ada (buat jika belum)
   * @param nama — Nama program studi (contoh: "D4 Animation")
   * @returns ID program studi atau error
   */
  ensure(nama: string): Promise<{ id?: string; error?: string }>;

  /**
   * getStudentMentors — Ambil semua relasi siswa-pembimbing
   * @returns Array relasi (studentId, mentorId)
   */
  getStudentMentors(): Promise<StudentMentor[]>;

  /**
   * setStudentMentor — Tetapkan pembimbing untuk siswa
   * @param studentId — UUID siswa
   * @param mentorId — UUID pembimbing
   */
  setStudentMentor(
    studentId: string,
    mentorId: string
  ): Promise<{ error?: string }>;
}
