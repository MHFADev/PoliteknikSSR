// ============================================================
// PgStudyProgramRepository — Implementasi IStudyProgramRepository
// ============================================================
// Menangani data program studi / jurusan dan relasi
// siswa-pembimbing dengan raw PostgreSQL queries.
// ============================================================

import { query } from "@/lib/postgres";
import type { StudyProgram, StudentMentor } from "../types";
import type { IStudyProgramRepository } from "../interfaces/IStudyProgramRepository";

/** Mapping snake_case → camelCase */
function mapStudyProgram(row: any): StudyProgram {
  return {
    id: row.id,
    nama: row.nama,
    kode: row.kode,
  };
}

function mapStudentMentor(row: any): StudentMentor {
  return {
    studentId: row.student_id,
    mentorId: row.mentor_id,
  };
}

export class PgStudyProgramRepository implements IStudyProgramRepository {
  /**
   * getAll — Ambil semua program studi
   */
  async getAll(): Promise<StudyProgram[]> {
    try {
      const result = await query(
        `SELECT id, nama, kode
         FROM study_programs
         ORDER BY nama ASC`
      );

      return result.rows.map(mapStudyProgram);
    } catch {
      return [];
    }
  }

  /**
   * ensure — Pastikan program studi ada (buat jika belum)
   */
  async ensure(
    nama: string
  ): Promise<{ id?: string; error?: string }> {
    const trimmed = nama.trim();
    if (!trimmed) return { error: "Nama program studi tidak boleh kosong." };

    try {
      // Cari yang sudah ada (case-insensitive)
      const existingResult = await query(
        `SELECT id FROM study_programs WHERE nama ILIKE $1 LIMIT 1`,
        [trimmed]
      );

      if (existingResult.rows.length > 0) {
        return { id: existingResult.rows[0].id };
      }

      // Generate kode dari nama
      const kode = trimmed
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 10);

      const result = await query(
        `INSERT INTO study_programs (id, nama, kode)
         VALUES (gen_random_uuid(), $1, $2)
         RETURNING id`,
        [trimmed, kode]
      );

      return { id: result.rows[0].id };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * getStudentMentors — Ambil semua relasi siswa-pembimbing
   */
  async getStudentMentors(): Promise<StudentMentor[]> {
    try {
      const result = await query(
        `SELECT student_id, mentor_id
         FROM student_mentors`
      );

      return result.rows.map(mapStudentMentor);
    } catch {
      return [];
    }
  }

  /**
   * setStudentMentor — Tetapkan pembimbing untuk siswa (upsert)
   */
  async setStudentMentor(
    studentId: string,
    mentorId: string
  ): Promise<{ error?: string }> {
    try {
      await query(
        `INSERT INTO student_mentors (student_id, mentor_id)
         VALUES ($1, $2)
         ON CONFLICT (student_id) DO UPDATE
         SET mentor_id = EXCLUDED.mentor_id`,
        [studentId, mentorId]
      );

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
