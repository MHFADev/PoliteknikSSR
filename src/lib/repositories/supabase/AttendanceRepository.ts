// ============================================================
// SupabaseAttendanceRepository — Implementasi IAttendanceRepository
// ============================================================
// Menangani sesi QR presensi dan record hasil scan siswa.
//
// Alur presensi:
// 1. Admin membuat sesi QR (createSession)
// 2. Siswa scan QR → verifikasi token (verifyAndRecordAttendance)
// 3. Admin/Pembimbing lihat rekap (getRecordsBySession / getRecordsByStudent)
//
// Mapping Supabase (snake_case) → Domain (camelCase):
// - session_date → sessionDate
// - expires_at → expiresAt
// - created_by → createdBy
// - created_at → createdAt
// - session_id → sessionId
// - student_id → studentId
// - scanned_at → scannedAt
// ============================================================

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { verifyAnyToken, generateDailyToken } from "@/lib/qr-token";
import { randomUUID } from "crypto";
import type {
  AttendanceSession,
  AttendanceRecord,
  AttendanceStatus,
} from "../types";
import type { IAttendanceRepository } from "../interfaces/IAttendanceRepository";

/** Batas jam "hadir" — lewat dari jam ini otomatis tercatat "telat" */
const ON_TIME_CUTOFF_HOUR = 8;

/** Durasi berlaku sesi QR dalam jam */
const SESSION_DURATION_HOURS = 12;

export class SupabaseAttendanceRepository implements IAttendanceRepository {
  /**
   * getTodaySession — Ambil sesi presensi untuk hari ini
   * @returns Sesi hari ini, atau null jika belum dibuat
   */
  async getTodaySession(): Promise<AttendanceSession | null> {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("session_date", today)
      .maybeSingle();

    if (!data) return null;

    // Mapping snake_case → camelCase
    return {
      id: data.id,
      sessionDate: data.session_date,
      token: data.token,
      expiresAt: data.expires_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  /**
   * createSession — Buat sesi presensi baru (QR token)
   * @param sessionDate — Tanggal sesi (YYYY-MM-DD)
   * @param token — Token QR terenkripsi
   * @param createdBy — UUID admin pembuat
   * @returns Sesi yang baru dibuat
   */
  async createSession(
    sessionDate: string,
    token: string,
    createdBy: string
  ): Promise<AttendanceSession> {
    const supabase = createAdminClient();
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("attendance_sessions")
      .upsert(
        {
          id: sessionId,
          session_date: sessionDate,
          token,
          expires_at: expiresAt,
          created_by: createdBy,
        },
        { onConflict: "session_date" }
      )
      .select()
      .single();

    if (error) throw new Error("Gagal membuat sesi QR: " + error.message);

    return {
      id: data.id,
      sessionDate: data.session_date,
      token: data.token,
      expiresAt: data.expires_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
    };
  }

  /**
   * verifyAndRecordAttendance — Verifikasi token QR & catat presensi
   *
   * Alur:
   * 1. Verifikasi token QR (daily/permanent) via HMAC
   * 2. Tentukan sessionId (daily dari token / permanent: buat otomatis)
   * 3. Cek apakah masih "hadir" (< jam cutoff) atau "telat"
   * 4. Insert ke attendance_records
   * 5. Tangani unique_violation (kode 23505) jika sudah presensi hari ini
   *
   * @param scannedToken — Token dari QR yang di-scan siswa
   * @param studentId — UUID siswa yang melakukan scan
   * @returns Status presensi (hadir / telat) atau error
   */
  async verifyAndRecordAttendance(
    scannedToken: string,
    studentId: string
  ): Promise<{ status: AttendanceStatus; error?: string }> {
    const supabase = createClient();
    const adminSupabase = createAdminClient();

    // --- Verifikasi token QR ---
    const verification = await verifyAnyToken(scannedToken, process.env.QR_SIGNING_SECRET!);
    if (!verification.valid) {
      return { status: "hadir", error: verification.reason };
    }

    let sessionId: string;
    const todayDate = new Date().toISOString().slice(0, 10);

    if (verification.payload.type === "daily") {
      // --- QR Harian: cari sesi yang sesuai dari database ---
      const { sessionId: dailySessionId, date } = verification.payload;
      const { data: session } = await supabase
        .from("attendance_sessions")
        .select("id, session_date")
        .eq("id", dailySessionId)
        .maybeSingle();

      if (!session || session.session_date !== date) {
        return { status: "hadir", error: "Sesi QR tidak ditemukan atau sudah tidak berlaku." };
      }
      sessionId = dailySessionId;
    } else if (verification.payload.type === "permanent") {
      // --- QR Permanen: pastikan QR milik user yang login ---
      if (verification.payload.studentId !== studentId) {
        return { status: "hadir", error: "QR ini bukan milik kamu!" };
      }

      // --- Cari sesi hari ini; buat otomatis jika belum ada ---
      let { data: todaySession } = await supabase
        .from("attendance_sessions")
        .select("id")
        .eq("session_date", todayDate)
        .maybeSingle();

      if (!todaySession) {
        const newSessionId = randomUUID();
        const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
        const token = await generateDailyToken(
          {
            sessionId: newSessionId,
            date: todayDate,
            exp: expiresAt.getTime(),
          },
          process.env.QR_SIGNING_SECRET!
        );

        const { data: createdSession, error: createError } = await adminSupabase
          .from("attendance_sessions")
          .insert({
            id: newSessionId,
            session_date: todayDate,
            token,
            expires_at: expiresAt.toISOString(),
            created_by: studentId,
          })
          .select("id")
          .single();

        if (createError) {
          return { status: "hadir", error: "Gagal memproses presensi: " + createError.message };
        }
        todaySession = createdSession!;
      }

      sessionId = todaySession.id;
    } else {
      return { status: "hadir", error: "Jenis QR tidak dikenali." };
    }

    // --- Tentukan status hadir/telat berdasarkan jam ---
    const isOnTime = new Date().getHours() < ON_TIME_CUTOFF_HOUR;
    const status: AttendanceStatus = isOnTime ? "hadir" : "telat";

    // --- Simpan record presensi ---
    const { error } = await adminSupabase.from("attendance_records").insert({
      session_id: sessionId,
      student_id: studentId,
      status,
    });

    if (error) {
      // Kode 23505 = unique_violation → siswa sudah presensi hari ini
      if (error.code === "23505") {
        return { status, error: "Kamu sudah melakukan presensi hari ini." };
      }
      return { status, error: "Gagal menyimpan presensi: " + error.message };
    }

    return { status };
  }

  /**
   * getRecordsByStudent — Ambil riwayat presensi siswa dalam rentang tanggal
   * @param studentId — UUID siswa
   * @param start — Tanggal awal (YYYY-MM-DD)
   * @param end — Tanggal akhir (YYYY-MM-DD)
   * @returns Array record presensi { scannedAt, status }
   */
  async getRecordsByStudent(
    studentId: string,
    start: string,
    end: string
  ): Promise<{ scannedAt: string; status: string }[]> {
    const supabase = createClient();

    const { data } = await supabase
      .from("attendance_records")
      .select("scanned_at, status")
      .eq("student_id", studentId)
      .gte("scanned_at", `${start}T00:00:00`)
      .lte("scanned_at", `${end}T23:59:59`)
      .order("scanned_at", { ascending: false });

    if (!data) return [];

    // Mapping snake_case → camelCase
    return data.map((r) => ({
      scannedAt: r.scanned_at,
      status: r.status,
    }));
  }

  /**
   * getRecordsBySession — Ambil semua presensi dalam satu sesi
   * @param sessionId — UUID sesi
   * @returns Array record presensi untuk sesi tsb
   */
  async getRecordsBySession(sessionId: string): Promise<AttendanceRecord[]> {
    const supabase = createClient();

    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("session_id", sessionId)
      .order("scanned_at", { ascending: true });

    if (!data) return [];

    // Mapping snake_case → camelCase
    return data.map((r) => ({
      id: r.id,
      sessionId: r.session_id,
      studentId: r.student_id,
      scannedAt: r.scanned_at,
      status: r.status as AttendanceStatus,
    }));
  }
}
