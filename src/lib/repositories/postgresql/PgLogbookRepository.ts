// ============================================================
// PgLogbookRepository — Implementasi ILogbookRepository
// ============================================================
// Menangani catatan kegiatan harian siswa (logbook PKL)
// dengan raw PostgreSQL queries.
// ============================================================

import { query } from "@/lib/postgres";
import type { LogbookEntry } from "../types";
import type { ILogbookRepository } from "../interfaces/ILogbookRepository";

/** Mapping snake_case → camelCase */
function mapEntry(row: any): LogbookEntry {
  return {
    id: row.id,
    studentId: row.student_id,
    entryDate: row.entry_date,
    activity: row.content,
    photoUrl: row.photo_url,
    grade: row.grade,
    feedback: row.feedback,
    gradedBy: row.graded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class PgLogbookRepository implements ILogbookRepository {
  /**
   * upsertEntry — Buat atau update entri logbook untuk hari tertentu
   */
  async upsertEntry(
    studentId: string,
    entryDate: string,
    activity: string,
    photoUrl?: string
  ): Promise<{ id?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO logbook_entries
           (id, student_id, entry_date, content, photo_url, updated_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW()::text)
         ON CONFLICT (student_id, entry_date) DO UPDATE
         SET content = EXCLUDED.content,
             photo_url = EXCLUDED.photo_url,
             updated_at = NOW()::text
         RETURNING id`,
        [studentId, entryDate, activity, photoUrl || null]
      );

      return { id: result.rows[0].id };
    } catch (err: any) {
      return { error: "Gagal menyimpan logbook: " + err.message };
    }
  }

  /**
   * gradeEntry — Beri nilai pada entri logbook
   */
  async gradeEntry(
    id: string,
    grade: number,
    feedback?: string,
    gradedBy?: string
  ): Promise<{ error?: string }> {
    try {
      await query(
        `UPDATE logbook_entries
         SET grade = $1,
             feedback = $2,
             graded_by = $3,
             graded_at = NOW()::text
         WHERE id = $4`,
        [grade, feedback || null, gradedBy || null, id]
      );

      return {};
    } catch (err: any) {
      return { error: "Gagal menyimpan nilai: " + err.message };
    }
  }

  /**
   * getEntriesByStudent — Ambil entri milik siswa
   */
  async getEntriesByStudent(
    studentId: string,
    start?: string,
    end?: string
  ): Promise<LogbookEntry[]> {
    try {
      const conditions: string[] = ["student_id = $1"];
      const params: any[] = [studentId];
      let idx = 2;

      if (start) {
        conditions.push(`entry_date >= $${idx++}`);
        params.push(start);
      }
      if (end) {
        conditions.push(`entry_date <= $${idx++}`);
        params.push(end);
      }

      const result = await query(
        `SELECT id, student_id, entry_date, content, photo_url,
                grade, feedback, graded_by, graded_at, created_at, updated_at
         FROM logbook_entries
         WHERE ${conditions.join(" AND ")}
         ORDER BY entry_date DESC`,
        params
      );

      return result.rows.map(mapEntry);
    } catch {
      return [];
    }
  }

  /**
   * getEntriesByMentor — Ambil entri dari semua siswa bimbingan
   */
  async getEntriesByMentor(mentorId: string): Promise<LogbookEntry[]> {
    try {
      const result = await query(
        `SELECT le.id, le.student_id, le.entry_date, le.content, le.photo_url,
                le.grade, le.feedback, le.graded_by, le.graded_at,
                le.created_at, le.updated_at
         FROM logbook_entries le
         INNER JOIN student_mentors sm ON le.student_id = sm.student_id
         WHERE sm.mentor_id = $1
         ORDER BY le.entry_date DESC`,
        [mentorId]
      );

      return result.rows.map(mapEntry);
    } catch {
      return [];
    }
  }

  /**
   * getPendingGrading — Ambil entri yang belum dinilai
   */
  async getPendingGrading(mentorId: string): Promise<LogbookEntry[]> {
    try {
      const result = await query(
        `SELECT le.id, le.student_id, le.entry_date, le.content, le.photo_url,
                le.grade, le.feedback, le.graded_by, le.graded_at,
                le.created_at, le.updated_at
         FROM logbook_entries le
         INNER JOIN student_mentors sm ON le.student_id = sm.student_id
         WHERE sm.mentor_id = $1 AND le.grade IS NULL
         ORDER BY le.entry_date DESC`,
        [mentorId]
      );

      return result.rows.map(mapEntry);
    } catch {
      return [];
    }
  }

  /**
   * getAllEntries — Ambil semua entri dengan filter opsional
   */
  async getAllEntries(
    filters?: { studentId?: string; graded?: boolean }
  ): Promise<LogbookEntry[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (filters?.studentId) {
        conditions.push(`student_id = $${idx++}`);
        params.push(filters.studentId);
      }
      if (filters?.graded === true) {
        conditions.push(`grade IS NOT NULL`);
      } else if (filters?.graded === false) {
        conditions.push(`grade IS NULL`);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const result = await query(
        `SELECT id, student_id, entry_date, content, photo_url,
                grade, feedback, graded_by, graded_at, created_at, updated_at
         FROM logbook_entries
         ${whereClause}
         ORDER BY entry_date DESC`,
        params
      );

      return result.rows.map(mapEntry);
    } catch {
      return [];
    }
  }

  /**
   * getUploadUrl — Dapatkan URL untuk upload foto logbook
   * Untuk PostgreSQL/local storage, return path statis
   */
  async getUploadUrl(
    studentId: string,
    entryDate: string
  ): Promise<string | null> {
    return `/uploads/logbook_photos/${studentId}/${entryDate}/proof.jpg`;
  }
}
