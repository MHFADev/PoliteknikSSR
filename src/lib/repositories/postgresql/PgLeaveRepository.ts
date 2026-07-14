// ============================================================
// PgLeaveRepository — Implementasi ILeaveRepository
// ============================================================
// Menangani pengajuan izin, sakit, dan cuti oleh siswa dengan
// raw PostgreSQL queries.
// ============================================================

import { query } from "@/lib/postgres";
import type {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  CreateLeaveInput,
} from "../types";
import type { ILeaveRepository } from "../interfaces/ILeaveRepository";

/** Mapping snake_case → camelCase */
function mapLeave(row: any): LeaveRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    type: row.type as LeaveType,
    reason: row.reason,
    proofUrl: row.proof_url,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as LeaveStatus,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_note,
    createdAt: row.created_at,
  };
}

export class PgLeaveRepository implements ILeaveRepository {
  /**
   * createLeave — Ajukan izin baru
   */
  async createLeave(
    input: CreateLeaveInput
  ): Promise<{ id?: string; error?: string }> {
    if (input.endDate < input.startDate) {
      return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
    }

    try {
      const result = await query(
        `INSERT INTO leave_requests
           (id, student_id, type, reason, proof_url, start_date, end_date, status)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, 'pending')
         RETURNING id`,
        [
          input.studentId,
          input.type,
          input.reason,
          input.proofUrl || null,
          input.startDate,
          input.endDate,
        ]
      );

      return { id: result.rows[0].id };
    } catch (err: any) {
      return { error: "Gagal mengirim pengajuan: " + err.message };
    }
  }

  /**
   * reviewLeave — Review pengajuan izin
   */
  async reviewLeave(
    id: string,
    status: LeaveStatus,
    reviewedBy: string,
    notes?: string
  ): Promise<{ error?: string }> {
    try {
      const result = await query(
        `UPDATE leave_requests
         SET status = $1,
             reviewed_by = $2,
             reviewed_at = NOW()::text,
             review_note = $3
         WHERE id = $4 AND status = 'pending'`,
        [status, reviewedBy, notes || null, id]
      );

      if (result.rowCount === 0) {
        return { error: "Pengajuan tidak ditemukan atau sudah diproses." };
      }

      return {};
    } catch (err: any) {
      return { error: "Gagal memproses: " + err.message };
    }
  }

  /**
   * getLeavesByStudent — Ambil semua pengajuan milik siswa
   */
  async getLeavesByStudent(studentId: string): Promise<LeaveRequest[]> {
    try {
      const result = await query(
        `SELECT id, student_id, type, reason, proof_url, start_date,
                end_date, status, reviewed_by, reviewed_at, review_note,
                created_at
         FROM leave_requests
         WHERE student_id = $1
         ORDER BY created_at DESC`,
        [studentId]
      );

      return result.rows.map(mapLeave);
    } catch {
      return [];
    }
  }

  /**
   * getPendingLeaves — Ambil semua pengajuan yang pending
   */
  async getPendingLeaves(): Promise<LeaveRequest[]> {
    try {
      const result = await query(
        `SELECT id, student_id, type, reason, proof_url, start_date,
                end_date, status, reviewed_by, reviewed_at, review_note,
                created_at
         FROM leave_requests
         WHERE status = 'pending'
         ORDER BY created_at DESC`
      );

      return result.rows.map(mapLeave);
    } catch {
      return [];
    }
  }

  /**
   * getLeavesByMentor — Ambil pengajuan dari siswa bimbingan
   */
  async getLeavesByMentor(mentorId: string): Promise<LeaveRequest[]> {
    try {
      const result = await query(
        `SELECT lr.id, lr.student_id, lr.type, lr.reason, lr.proof_url,
                lr.start_date, lr.end_date, lr.status, lr.reviewed_by,
                lr.reviewed_at, lr.review_note, lr.created_at
         FROM leave_requests lr
         INNER JOIN student_mentors sm ON lr.student_id = sm.student_id
         WHERE sm.mentor_id = $1
         ORDER BY lr.created_at DESC`,
        [mentorId]
      );

      return result.rows.map(mapLeave);
    } catch {
      return [];
    }
  }

  /**
   * getAllLeaves — Ambil semua pengajuan dengan filter opsional
   */
  async getAllLeaves(
    filters?: { status?: LeaveStatus; type?: LeaveType }
  ): Promise<LeaveRequest[]> {
    try {
      const conditions: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (filters?.status) {
        conditions.push(`status = $${idx++}`);
        params.push(filters.status);
      }
      if (filters?.type) {
        conditions.push(`type = $${idx++}`);
        params.push(filters.type);
      }

      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const result = await query(
        `SELECT id, student_id, type, reason, proof_url, start_date,
                end_date, status, reviewed_by, reviewed_at, review_note,
                created_at
         FROM leave_requests
         ${whereClause}
         ORDER BY created_at DESC`,
        params
      );

      return result.rows.map(mapLeave);
    } catch {
      return [];
    }
  }
}
