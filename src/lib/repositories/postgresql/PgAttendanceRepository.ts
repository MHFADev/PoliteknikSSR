// ============================================================
// PgAttendanceRepository — Implementasi IAttendanceRepository
// ============================================================
// Menangani sesi QR presensi dan record hasil scan siswa
// dengan raw PostgreSQL queries.
// ============================================================

import { query, transaction } from "@/lib/postgres";
import type {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
} from "../types";
import type { IAttendanceRepository } from "../interfaces/IAttendanceRepository";

const ON_TIME_CUTOFF_HOUR = 8;
const SESSION_DURATION_HOURS = 12;

/** Mapping snake_case → camelCase untuk AttendanceSession */
function mapSession(row: any): AttendanceSession {
  return {
    id: row.id,
    sessionDate: row.session_date,
    token: row.token,
    expiresAt: row.expires_at,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/** Mapping snake_case → camelCase untuk AttendanceRecord */
function mapRecord(row: any): AttendanceRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    studentId: row.student_id,
    scannedAt: row.scanned_at,
    status: row.status as AttendanceStatus,
  };
}

export class PgAttendanceRepository implements IAttendanceRepository {
  /**
   * getTodaySession — Ambil sesi presensi untuk hari ini
   */
  async getTodaySession(): Promise<AttendanceSession | null> {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const result = await query(
        `SELECT id, session_date, token, expires_at, created_by, created_at
         FROM attendance_sessions
         WHERE session_date = $1
         LIMIT 1`,
        [today]
      );

      if (result.rows.length === 0) return null;
      return mapSession(result.rows[0]);
    } catch {
      return null;
    }
  }

  /**
   * createSession — Buat sesi presensi baru (upsert per tanggal)
   */
  async createSession(
    sessionDate: string,
    token: string,
    createdBy: string
  ): Promise<AttendanceSession> {
    const expiresAt = new Date(
      Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000
    ).toISOString();

    // Upsert: jika sudah ada sesi untuk tanggal ini, update token-nya
    const result = await query(
      `INSERT INTO attendance_sessions (id, session_date, token, expires_at, created_by)
       VALUES (gen_random_uuid(), $1, $2, $3, $4)
       ON CONFLICT (session_date) DO UPDATE
       SET token = EXCLUDED.token,
           expires_at = EXCLUDED.expires_at,
           created_by = EXCLUDED.created_by
       RETURNING id, session_date, token, expires_at, created_by, created_at`,
      [sessionDate, token, expiresAt, createdBy]
    );

    return mapSession(result.rows[0]);
  }

  /**
   * verifyAndRecordAttendance — Verifikasi token QR & catat presensi
   */
  async verifyAndRecordAttendance(
    scannedToken: string,
    studentId: string
  ): Promise<{ status: AttendanceStatus; error?: string }> {
    try {
      // Cari sesi berdasarkan token
      const sessionResult = await query(
        `SELECT id, session_date, expires_at
         FROM attendance_sessions
         WHERE token = $1
         LIMIT 1`,
        [scannedToken]
      );

      if (sessionResult.rows.length === 0) {
        return { status: "hadir", error: "Token QR tidak valid." };
      }

      const session = sessionResult.rows[0];

      // Cek apakah sesi masih berlaku
      if (session.expires_at && new Date(session.expires_at) < new Date()) {
        return { status: "hadir", error: "Sesi QR sudah expired." };
      }

      // Tentukan status hadir/telat
      const isOnTime = new Date().getHours() < ON_TIME_CUTOFF_HOUR;
      const status: AttendanceStatus = isOnTime ? "hadir" : "telat";

      // Insert record presensi
      const insertResult = await query(
        `INSERT INTO attendance_records (id, session_id, student_id, status)
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [session.id, studentId, status]
      );

      return { status };
    } catch (err: any) {
      // Kode 23505 = unique_violation → siswa sudah presensi
      if (err.code === "23505") {
        return { status: "hadir", error: "Kamu sudah melakukan presensi hari ini." };
      }
      return { status: "hadir", error: "Gagal menyimpan presensi: " + err.message };
    }
  }

  /**
   * getRecordsByStudent — Ambil riwayat presensi siswa
   */
  async getRecordsByStudent(
    studentId: string,
    start: string,
    end: string
  ): Promise<{ scannedAt: string; status: string }[]> {
    try {
      const result = await query(
        `SELECT scanned_at, status
         FROM attendance_records
         WHERE student_id = $1
           AND scanned_at >= $2::timestamp
           AND scanned_at <= ($3 || 'T23:59:59')::timestamp
         ORDER BY scanned_at DESC`,
        [studentId, start, end]
      );

      return result.rows.map((r) => ({
        scannedAt: r.scanned_at,
        status: r.status,
      }));
    } catch {
      return [];
    }
  }

  /**
   * getRecordsBySession — Ambil semua presensi dalam satu sesi
   */
  async getRecordsBySession(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      const result = await query(
        `SELECT id, session_id, student_id, scanned_at, status
         FROM attendance_records
         WHERE session_id = $1
         ORDER BY scanned_at ASC`,
        [sessionId]
      );

      return result.rows.map(mapRecord);
    } catch {
      return [];
    }
  }
}
