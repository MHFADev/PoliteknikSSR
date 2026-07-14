// ============================================================
// PgUserRepository — Implementasi IUserRepository untuk PostgreSQL
// ============================================================
// Mengelola operasi CRUD user, autentikasi, dan statistik
// presensi dengan raw PostgreSQL queries.
// ============================================================

import { query, transaction } from "@/lib/postgres";
import type {
  User,
  UserRole,
  CreateUserInput,
  PendingUser,
  AttendanceStatsQuery,
  AttendanceStats,
} from "../types";
import type { IUserRepository } from "../interfaces/IUserRepository";
import type { IAuthProvider } from "../interfaces/IAuthProvider";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/** Mapping row (snake_case + join) ke domain User (camelCase) */
function mapRow(row: any): User {
  return {
    id: row.id,
    email: row.email || "",
    fullName: row.full_name || "",
    role: row.role || "siswa",
    identityNumber: row.identity_number || null,
    instansi: row.instansi || null,
    kelas: row.kelas || null,
    jurusanId: row.jurusan_id || null,
    studyProgramName: row.study_program_nama || null,
    avatarUrl: row.avatar_url || null,
    approved: row.approved ?? false,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export class PgUserRepository implements IUserRepository {
  private authProvider: IAuthProvider;

  constructor(authProvider: IAuthProvider) {
    this.authProvider = authProvider;
  }

  /**
   * getCurrentUser — Ambil user dari session cookie.
   * Di PostgreSQL, method ini bergantung pada session yang di-pass dari request.
   * Untuk SSR, gunakan getUserById dengan ID dari session.
   */
  async getCurrentUser(): Promise<User | null> {
    // Dalam implementasi PostgreSQL, getCurrentUser memerlukan session token
    // dari cookie/request. Untuk saat ini, return null karena
    // session management dilakukan di middleware.
    return null;
  }

  /**
   * getUserById — Cari user berdasarkan ID dengan JOIN study_programs
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const result = await query(
        `SELECT p.id, p.email, p.full_name, p.role, p.identity_number,
                p.instansi, p.kelas, p.jurusan_id, p.avatar_url,
                p.approved, p.created_at,
                sp.nama AS study_program_nama
         FROM profiles p
         LEFT JOIN study_programs sp ON p.jurusan_id = sp.id
         WHERE p.id = $1
         LIMIT 1`,
        [id]
      );

      if (result.rows.length === 0) return null;
      return mapRow(result.rows[0]);
    } catch {
      return null;
    }
  }

  /**
   * getUsersByRole — Ambil semua user dengan role tertentu
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      const result = await query(
        `SELECT p.id, p.email, p.full_name, p.role, p.identity_number,
                p.instansi, p.kelas, p.jurusan_id, p.avatar_url,
                p.approved, p.created_at,
                sp.nama AS study_program_nama
         FROM profiles p
         LEFT JOIN study_programs sp ON p.jurusan_id = sp.id
         WHERE p.role = $1
         ORDER BY p.full_name ASC`,
        [role]
      );

      return result.rows.map(mapRow);
    } catch {
      return [];
    }
  }

  /**
   * signIn — Login dengan email & password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: User | null; error?: string }> {
    const authResult = await this.authProvider.signIn(email, password);
    if (authResult.error || !authResult.user) {
      return { user: null, error: authResult.error };
    }

    const user = await this.getUserById(authResult.user.id);
    return { user };
  }

  /**
   * signUp — Registrasi user baru
   */
  async signUp(
    input: CreateUserInput
  ): Promise<{ userId?: string; error?: string }> {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const userId = crypto.randomUUID();

    try {
      await query(
        `INSERT INTO profiles (id, email, password_hash, full_name, role,
                               identity_number, instansi, kelas, jurusan_id, approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          input.email,
          passwordHash,
          input.fullName,
          input.role,
          input.identityNumber || null,
          input.instansi || null,
          input.kelas || null,
          input.jurusanId || null,
          false,
        ]
      );

      return { userId };
    } catch (err: any) {
      if (err.code === "23505") {
        return { error: "Email sudah terdaftar." };
      }
      return { error: "Gagal membuat akun: " + err.message };
    }
  }

  /**
   * signOut — Logout
   */
  async signOut(): Promise<void> {
    // Session cleanup handled by client-side cookie clearing
  }

  /**
   * createUser — Admin membuat user baru (langsung aktif)
   */
  async createUser(
    input: CreateUserInput
  ): Promise<{ userId: string; error?: string }> {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const userId = crypto.randomUUID();

    try {
      await query(
        `INSERT INTO profiles (id, email, password_hash, full_name, role,
                               identity_number, instansi, kelas, jurusan_id, approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          input.email,
          passwordHash,
          input.fullName,
          input.role,
          input.identityNumber || null,
          input.instansi || null,
          input.kelas || null,
          input.jurusanId || null,
          true,
        ]
      );

      return { userId };
    } catch (err: any) {
      if (err.code === "23505") {
        return { userId: "", error: "Email sudah terdaftar." };
      }
      return { userId: "", error: "Gagal membuat user: " + err.message };
    }
  }

  /**
   * updateProfile — Update data profil user
   */
  async updateProfile(
    id: string,
    data: Partial<User>
  ): Promise<{ error?: string }> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (data.fullName !== undefined) {
        fields.push(`full_name = $${idx++}`);
        values.push(data.fullName);
      }
      if (data.identityNumber !== undefined) {
        fields.push(`identity_number = $${idx++}`);
        values.push(data.identityNumber);
      }
      if (data.instansi !== undefined) {
        fields.push(`instansi = $${idx++}`);
        values.push(data.instansi);
      }
      if (data.kelas !== undefined) {
        fields.push(`kelas = $${idx++}`);
        values.push(data.kelas);
      }
      if (data.jurusanId !== undefined) {
        fields.push(`jurusan_id = $${idx++}`);
        values.push(data.jurusanId);
      }
      if (data.role !== undefined) {
        fields.push(`role = $${idx++}`);
        values.push(data.role);
      }
      if (data.avatarUrl !== undefined) {
        fields.push(`avatar_url = $${idx++}`);
        values.push(data.avatarUrl);
      }

      if (fields.length === 0) return {};

      values.push(id);
      await query(
        `UPDATE profiles SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * getPendingUsers — Ambil user yang belum disetujui admin
   */
  async getPendingUsers(): Promise<PendingUser[]> {
    try {
      const result = await query(
        `SELECT id, email, full_name, role, created_at
         FROM profiles
         WHERE approved = false
         ORDER BY created_at DESC`
      );

      return result.rows.map((r) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        role: r.role,
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * approveUser — Setujui akun user
   */
  async approveUser(userId: string): Promise<{ error?: string }> {
    try {
      await query(`UPDATE profiles SET approved = true WHERE id = $1`, [userId]);
      return {};
    } catch (err: any) {
      return { error: "Gagal menyetujui user: " + err.message };
    }
  }

  /**
   * rejectUser — Tolak akun user (hapus)
   */
  async rejectUser(userId: string): Promise<{ error?: string }> {
    try {
      await query(`DELETE FROM profiles WHERE id = $1`, [userId]);
      return {};
    } catch (err: any) {
      return { error: "Gagal menolak user: " + err.message };
    }
  }

  async deleteUser(userId: string): Promise<{ error?: string }> {
    try {
      await query(`DELETE FROM profiles WHERE id = $1`, [userId]);
      return {};
    } catch (err: any) {
      return { error: "Gagal menghapus user: " + err.message };
    }
  }

  async blockUser(userId: string): Promise<{ error?: string }> {
    try {
      await query(`UPDATE profiles SET approved = false WHERE id = $1`, [userId]);
      return {};
    } catch (err: any) {
      return { error: "Gagal memblokir user: " + err.message };
    }
  }

  async unblockUser(userId: string): Promise<{ error?: string }> {
    try {
      await query(`UPDATE profiles SET approved = true WHERE id = $1`, [userId]);
      return {};
    } catch (err: any) {
      return { error: "Gagal membuka blokir: " + err.message };
    }
  }

  async updateUserRole(userId: string, role: UserRole): Promise<{ error?: string }> {
    try {
      await query(`UPDATE profiles SET role = $1 WHERE id = $2`, [role, userId]);
      return {};
    } catch (err: any) {
      return { error: "Gagal mengubah role: " + err.message };
    }
  }

  /**
   * getAttendanceStats — Hitung statistik presensi dengan SQL aggregations
   */
  async getAttendanceStats(
    statsQuery: AttendanceStatsQuery
  ): Promise<AttendanceStats[]> {
    try {
      const days = statsQuery.days || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const start = startDate.toISOString().slice(0, 10);

      // Bangun WHERE clause dinamis untuk filter siswa
      const conditions: string[] = ["p.role = 'siswa'"];
      const params: any[] = [];
      let paramIdx = 1;

      if (statsQuery.studentId) {
        conditions.push(`p.id = $${paramIdx++}`);
        params.push(statsQuery.studentId);
      }
      if (statsQuery.name) {
        conditions.push(`p.full_name ILIKE $${paramIdx++}`);
        params.push(`%${statsQuery.name}%`);
      }
      if (statsQuery.kelas) {
        conditions.push(`p.kelas ILIKE $${paramIdx++}`);
        params.push(`%${statsQuery.kelas}%`);
      }

      const whereClause = conditions.join(" AND ");

      // Query utama: ambil semua siswa yang memenuhi filter
      const studentsResult = await query(
        `SELECT p.id, p.full_name, p.kelas, p.avatar_url, p.created_at,
                sp.nama AS study_program_nama
         FROM profiles p
         LEFT JOIN study_programs sp ON p.jurusan_id = sp.id
         WHERE ${whereClause}
         ORDER BY p.full_name ASC`,
        params
      );

      const students = studentsResult.rows;

      // Query presensi dalam rentang waktu
      const recordsResult = await query(
        `SELECT student_id, status, scanned_at
         FROM attendance_records
         WHERE scanned_at >= $1::timestamp`,
        [start]
      );

      // Query izin yang disetujui
      const leavesResult = await query(
        `SELECT student_id, type, start_date, end_date
         FROM leave_requests
         WHERE status = 'disetujui'
           AND end_date >= $1`,
        [start]
      );

      const allRecords = recordsResult.rows;
      const allLeaves = leavesResult.rows;

      // Filter jurusan secara in-memory (karena dari JOIN)
      const filteredStudents = statsQuery.jurusan
        ? students.filter((s) =>
            s.study_program_nama
              ?.toLowerCase()
              .includes(statsQuery.jurusan!.toLowerCase())
          )
        : students;

      // Hitung statistik untuk setiap siswa
      return filteredStudents.map((student) => {
        const studentRecords = allRecords.filter(
          (r) => r.student_id === student.id
        );
        const hadir = studentRecords.filter(
          (r) => r.status === "hadir"
        ).length;
        const telat = studentRecords.filter(
          (r) => r.status === "telat"
        ).length;

        const studentLeaves = allLeaves.filter(
          (l) => l.student_id === student.id
        );
        let izin = 0;
        let sakit = 0;

        studentLeaves.forEach((leave) => {
          const s = new Date(leave.start_date);
          const e = new Date(leave.end_date);
          let dayCount =
            Math.ceil(
              (e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)
            ) + 1;

          const limitStart = new Date(start);
          if (s < limitStart) {
            dayCount =
              Math.ceil(
                (e.getTime() - limitStart.getTime()) / (1000 * 60 * 60 * 24)
              ) + 1;
          }

          if (leave.type === "izin") izin += dayCount;
          if (leave.type === "sakit") sakit += dayCount;
        });

        const studentCreated = student.created_at
          ? new Date(student.created_at)
          : new Date(start);
        const effectiveStart =
          studentCreated > new Date(start) ? studentCreated : new Date(start);

        const hasAnyRecords = hadir + telat + izin + sakit > 0;
        const endDate = new Date();
        let totalDays = Math.ceil(
          (endDate.getTime() - effectiveStart.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        totalDays = Math.max(totalDays, 1);
        const alfa = hasAnyRecords
          ? Math.max(0, totalDays - (hadir + telat + izin + sakit))
          : 0;

        return {
          studentId: student.id,
          fullName: student.full_name,
          kelas: student.kelas,
          jurusan: student.study_program_nama || null,
          avatarUrl: student.avatar_url || null,
          hadir,
          telat,
          izin,
          sakit,
          alfa,
          total: totalDays,
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * getAllStudents — Ambil semua siswa dengan info program studi
   */
  async getAllStudents(): Promise<User[]> {
    try {
      const result = await query(
        `SELECT p.id, p.email, p.full_name, p.role, p.identity_number,
                p.instansi, p.kelas, p.jurusan_id, p.avatar_url,
                p.approved, p.created_at,
                sp.nama AS study_program_nama
         FROM profiles p
         LEFT JOIN study_programs sp ON p.jurusan_id = sp.id
         WHERE p.role = 'siswa'
         ORDER BY p.full_name ASC`
      );

      return result.rows.map(mapRow);
    } catch {
      return [];
    }
  }
}
