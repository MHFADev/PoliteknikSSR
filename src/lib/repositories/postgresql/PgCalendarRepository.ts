// ============================================================
// PgCalendarRepository — Implementasi ICalendarRepository
// ============================================================
// Menangani event kalender dan ringkasan presensi bulanan
// dengan raw PostgreSQL queries.
// ============================================================

import { query } from "@/lib/postgres";
import type {
  CalendarEvent,
  CreateEventInput,
  MonthlyAttendance,
} from "../types";
import type { ICalendarRepository } from "../interfaces/ICalendarRepository";

/** Mapping snake_case → camelCase */
function mapEvent(row: any): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? null,
    eventDate: row.event_date,
    endDate: row.end_date ?? null,
    tipe: row.tipe,
    studentId: row.student_id ?? null,
    createdBy: row.created_by,
    creatorName: row.creator_name ?? null,
    studentName: row.student_name ?? null,
  };
}

/** Hitung tanggal awal dan akhir bulan */
function getMonthRange(year: number, month: number): [string, string] {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0);
  const end = lastDay.toISOString().slice(0, 10);
  return [start, end];
}

export class PgCalendarRepository implements ICalendarRepository {
  /**
   * getEvents — Ambil event dalam bulan & tahun tertentu
   */
  async getEvents(
    year: number,
    month: number,
    studentId?: string | null
  ): Promise<CalendarEvent[]> {
    try {
      const [start, end] = getMonthRange(year, month);

      let sql = `
        SELECT ce.id, ce.title, ce.description, ce.event_date, ce.end_date,
               ce.tipe, ce.student_id, ce.created_by,
               p.full_name AS creator_name,
               NULL::text AS student_name
        FROM calendar_events ce
        LEFT JOIN profiles p ON ce.created_by = p.id
        WHERE ce.event_date >= $1 AND ce.event_date <= $2`;

      const params: any[] = [start, end];
      let idx = 3;

      if (studentId) {
        sql += ` AND (ce.student_id = $${idx} OR ce.student_id IS NULL)`;
        params.push(studentId);
        idx++;
      }

      sql += ` ORDER BY ce.event_date ASC`;

      const result = await query(sql, params);
      return result.rows.map(mapEvent);
    } catch {
      return [];
    }
  }

  /**
   * getAllEvents — Ambil semua event (dashboard admin)
   */
  async getAllEvents(search?: string): Promise<CalendarEvent[]> {
    try {
      let sql = `
        SELECT ce.id, ce.title, ce.description, ce.event_date, ce.end_date,
               ce.tipe, ce.student_id, ce.created_by,
               p.full_name AS creator_name,
               NULL::text AS student_name
        FROM calendar_events ce
        LEFT JOIN profiles p ON ce.created_by = p.id`;

      const params: any[] = [];

      if (search) {
        sql += ` WHERE ce.title ILIKE $1 OR p.full_name ILIKE $1`;
        params.push(`%${search}%`);
      }

      sql += ` ORDER BY ce.event_date DESC`;

      const result = await query(sql, params);
      return result.rows.map(mapEvent);
    } catch {
      return [];
    }
  }

  /**
   * createEvent — Buat event kalender baru
   */
  async createEvent(
    input: CreateEventInput
  ): Promise<{ id?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO calendar_events
           (id, title, description, event_date, end_date, tipe, student_id, created_by)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          input.title,
          input.description,
          input.eventDate,
          input.endDate,
          input.tipe,
          input.studentId,
          input.createdBy,
        ]
      );

      return { id: result.rows[0].id };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * updateEvent — Update event kalender
   */
  async updateEvent(
    id: string,
    input: Partial<CreateEventInput>
  ): Promise<{ error?: string }> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (input.title !== undefined) {
        fields.push(`title = $${idx++}`);
        values.push(input.title);
      }
      if (input.description !== undefined) {
        fields.push(`description = $${idx++}`);
        values.push(input.description);
      }
      if (input.eventDate !== undefined) {
        fields.push(`event_date = $${idx++}`);
        values.push(input.eventDate);
      }
      if (input.endDate !== undefined) {
        fields.push(`end_date = $${idx++}`);
        values.push(input.endDate);
      }
      if (input.tipe !== undefined) {
        fields.push(`tipe = $${idx++}`);
        values.push(input.tipe);
      }
      if (input.studentId !== undefined) {
        fields.push(`student_id = $${idx++}`);
        values.push(input.studentId);
      }

      if (fields.length === 0) return {};

      values.push(id);
      await query(
        `UPDATE calendar_events SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * deleteEvent — Hapus event kalender
   */
  async deleteEvent(id: string): Promise<{ error?: string }> {
    try {
      await query(`DELETE FROM calendar_events WHERE id = $1`, [id]);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * getAdminStats — Statistik untuk dashboard admin
   */
  async getAdminStats(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    totalSiswa: number;
  }> {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [totalResult, upcomingResult, siswaResult] = await Promise.all([
        query(`SELECT COUNT(*)::int AS count FROM calendar_events`),
        query(
          `SELECT COUNT(*)::int AS count FROM calendar_events WHERE event_date >= $1`,
          [today]
        ),
        query(`SELECT COUNT(*)::int AS count FROM profiles WHERE role = 'siswa'`),
      ]);

      return {
        totalEvents: totalResult.rows[0]?.count ?? 0,
        upcomingEvents: upcomingResult.rows[0]?.count ?? 0,
        totalSiswa: siswaResult.rows[0]?.count ?? 0,
      };
    } catch {
      return { totalEvents: 0, upcomingEvents: 0, totalSiswa: 0 };
    }
  }

  /**
   * getUpcomingEvents — Ambil event mendatang
   */
  async getUpcomingEvents(limit: number): Promise<CalendarEvent[]> {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const result = await query(
        `SELECT ce.id, ce.title, ce.description, ce.event_date, ce.end_date,
               ce.tipe, ce.student_id, ce.created_by,
               p.full_name AS creator_name,
               NULL::text AS student_name
        FROM calendar_events ce
        LEFT JOIN profiles p ON ce.created_by = p.id
        WHERE ce.event_date >= $1
        ORDER BY ce.event_date ASC
        LIMIT $2`,
        [today, limit]
      );

      return result.rows.map(mapEvent);
    } catch {
      return [];
    }
  }

  /**
   * getStudentAttendanceByMonth — Data presensi & izin bulanan siswa
   */
  async getStudentAttendanceByMonth(
    studentId: string,
    year: number,
    month: number
  ): Promise<MonthlyAttendance> {
    const [start, end] = getMonthRange(year, month);

    // Ambil tanggal pendaftaran siswa
    let studentSince: string | null = null;
    try {
      const profileResult = await query(
        `SELECT created_at FROM profiles WHERE id = $1 LIMIT 1`,
        [studentId]
      );
      studentSince = profileResult.rows[0]?.created_at ?? null;
    } catch {
      // ignore
    }

    // Ambil records presensi
    let records: { scannedAt: string; status: string }[] = [];
    try {
      const recordsResult = await query(
        `SELECT scanned_at, status
         FROM attendance_records
         WHERE student_id = $1
           AND scanned_at >= $2
           AND scanned_at <= ($3 || 'T23:59:59')::timestamp`,
        [studentId, start, end]
      );
      records = recordsResult.rows.map((r) => ({
        scannedAt: r.scanned_at,
        status: r.status,
      }));
    } catch {
      // ignore
    }

    // Ambil izin yang disetujui dan overlap dengan bulan
    let leaves: {
      startDate: string;
      endDate: string;
      type: string;
      status: string;
    }[] = [];
    try {
      const leavesResult = await query(
        `SELECT start_date, end_date, type, status
         FROM leave_requests
         WHERE student_id = $1
           AND status = 'disetujui'
           AND start_date <= $3
           AND end_date >= $2`,
        [studentId, start, end]
      );
      leaves = leavesResult.rows.map((l) => ({
        startDate: l.start_date,
        endDate: l.end_date,
        type: l.type,
        status: l.status,
      }));
    } catch {
      // ignore
    }

    return { records, leaves, studentSince };
  }
}
