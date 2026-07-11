// ============================================================
// SupabaseCalendarRepository — Implementasi ICalendarRepository
// ============================================================
// Menangani event kalender (libur nasional, event kampus, event
// khusus siswa) serta ringkasan presensi bulanan per siswa.
//
// POLA IMPLEMENTASI:
// - createClient() untuk semua operasi READ (getEvents, getAllEvents, dll.)
// - createAdminClient() untuk semua operasi WRITE (createEvent, updateEvent, deleteEvent)
// - Mapping dari kolom Supabase snake_case ke properti domain camelCase
// - Join dengan tabel profiles untuk mendapatkan nama pembuat event (creatorName)
// ============================================================

import type {
  CalendarEvent,
  CreateEventInput,
  MonthlyAttendance,
} from "../types";
import type { ICalendarRepository } from "../interfaces/ICalendarRepository";
import type { Database } from "@/types/database";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// -----------------------------------------------------------
// Tipe internal untuk hasil query Supabase + join profiles
// -----------------------------------------------------------
// Row dari tabel calendar_events dengan join left ke profiles
// (untuk mendapatkan full_name pembuat event sebagai creatorName)
interface CalendarEventQueryResult {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  tipe: "libur" | "event";
  student_id: string | null;
  created_by: string;
  created_at: string;
  profiles: {
    full_name: string;
    identity_number: string | null;
    study_programs?: { nama: string } | null;
  } | null;
}

export class SupabaseCalendarRepository implements ICalendarRepository {
  // -----------------------------------------------------------
  // Helper: map baris Supabase (snake_case) ke CalendarEvent (camelCase)
  // -----------------------------------------------------------
  /**
   * mapEvent — Memetakan satu row hasil query calendar_events + join profiles
   * ke domain type CalendarEvent.
   *
   * @param row — Baris mentah dari Supabase (snake_case + nested profiles)
   * @returns CalendarEvent — Domain entity siap pakai
   */
  private mapEvent(row: CalendarEventQueryResult): CalendarEvent {
    return {
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      eventDate: row.event_date,
      endDate: row.end_date ?? null,
      tipe: row.tipe,
      studentId: row.student_id ?? null,
      createdBy: row.created_by,
      // profiles berisi data pembuat event (dari FK created_by)
      creatorName: row.profiles?.full_name ?? null,
      // studentName tidak di-join di query ini — di-set null
      // Jika dibutuhkan, lakukan join profiles!student_id atau query terpisah
      studentName: null,
    };
  }

  // -----------------------------------------------------------
  // Helper: hitung tanggal awal dan akhir bulan
  // -----------------------------------------------------------
  /**
   * getMonthRange — Menghitung string tanggal awal (YYYY-MM-DD) dan akhir bulan.
   *
   * @param year — Tahun (contoh: 2025)
   * @param month — Bulan (1-12)
   * @returns [startDate, endDate] — Awal dan akhir bulan dalam format ISO
   */
  private getMonthRange(year: number, month: number): [string, string] {
    const start = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0);
    const end = lastDay.toISOString().slice(0, 10);
    return [start, end];
  }

  // -----------------------------------------------------------
  // getEvents — Ambil event kalender dalam bulan & tahun tertentu
  // -----------------------------------------------------------
  /**
   * getEvents — Mengambil semua event dalam rentang bulan dan tahun yang diminta.
   * Jika studentId diberikan, hasil difilter untuk event milik siswa tersebut
   * plus event umum (student_id IS NULL).
   *
   * Query: SELECT * FROM calendar_events
   *   LEFT JOIN profiles ON created_by = profiles.id
   *   WHERE event_date BETWEEN ? AND ?
   *   AND (student_id = ? OR student_id IS NULL)  ← jika studentId disediakan
   *   ORDER BY event_date ASC
   *
   * @param year — Tahun (contoh: 2025)
   * @param month — Bulan (1-12)
   * @param studentId — ID siswa (opsional) untuk filter event personal
   * @returns Array CalendarEvent yang sudah di-map ke camelCase
   */
  async getEvents(
    year: number,
    month: number,
    studentId?: string | null
  ): Promise<CalendarEvent[]> {
    const supabase = createClient();
    const [start, end] = this.getMonthRange(year, month);

    let query = supabase
      .from("calendar_events")
      .select("*, profiles!left(full_name, identity_number)")
      .gte("event_date", start)
      .lte("event_date", end)
      .order("event_date", { ascending: true });

    // Jika studentId diberikan, filter event personal + event umum
    if (studentId) {
      query = query.or(`student_id.eq.${studentId},student_id.is.null`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[SupabaseCalendarRepository] getEvents error:", error.message);
      return [];
    }

    return (data ?? []).map((row) => this.mapEvent(row as unknown as CalendarEventQueryResult));
  }

  // -----------------------------------------------------------
  // getAllEvents — Ambil semua event (untuk dashboard admin)
  // -----------------------------------------------------------
  /**
   * getAllEvents — Mengambil seluruh event kalender, opsional difilter
   * dengan pencarian berdasarkan title atau nama pembuat event.
   * Diurutkan dari event_date terbaru.
   *
   * Query: SELECT * FROM calendar_events
   *   LEFT JOIN profiles ON created_by = profiles.id
   *   [WHERE title ILIKE '%search%' OR profiles.full_name ILIKE '%search%']
   *   ORDER BY event_date DESC
   *
   * @param search — Kata kunci pencarian (filter berdasarkan title atau nama pembuat)
   * @returns Array CalendarEvent
   */
  async getAllEvents(search?: string): Promise<CalendarEvent[]> {
    const supabase = createClient();

    let query = supabase
      .from("calendar_events")
      .select("*, profiles!left(full_name, identity_number, study_programs!left(nama))")
      .order("event_date", { ascending: false });

    // Filter berdasarkan title atau nama pembuat event
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,profiles.full_name.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[SupabaseCalendarRepository] getAllEvents error:", error.message);
      return [];
    }

    return (data ?? []).map((row) => this.mapEvent(row as unknown as CalendarEventQueryResult));
  }

  // -----------------------------------------------------------
  // createEvent — Buat event kalender baru
  // -----------------------------------------------------------
  /**
   * createEvent — Menambahkan event baru ke tabel calendar_events.
   * Menggunakan createAdminClient() (service role) untuk bypass RLS.
   * Mendapatkan user yang sedang login untuk mengisi created_by.
   *
   * @param input — CreateEventInput (title, description, eventDate, dll.)
   * @returns { id?: string; error?: string }
   */
  async createEvent(input: CreateEventInput): Promise<{ id?: string; error?: string }> {
    // Dapatkan user yang sedang login (dari session cookie)
    const { data: { user }, error: authError } = await createClient().auth.getUser();

    if (authError || !user) {
      return { error: "Unauthorized — Silakan login terlebih dahulu" };
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("calendar_events")
      .insert({
        title: input.title,
        description: input.description,
        event_date: input.eventDate,
        end_date: input.endDate,
        tipe: input.tipe,
        student_id: input.studentId,
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[SupabaseCalendarRepository] createEvent error:", error.message);
      return { error: error.message };
    }

    // Revalidasi path kalender agar data terbaru tampil
    revalidatePath("/dashboard/admin/kalender");
    revalidatePath("/dashboard/siswa/kalender");

    return { id: data?.id };
  }

  // -----------------------------------------------------------
  // updateEvent — Update event kalender yang sudah ada
  // -----------------------------------------------------------
  /**
   * updateEvent — Memperbarui data event berdasarkan ID.
   * Input partial — hanya field yang diberikan yang akan di-update.
   *
   * @param id — UUID event
   * @param input — Partial<CreateEventInput> berisi field yang ingin diubah
   * @returns { error?: string }
   */
  async updateEvent(
    id: string,
    input: Partial<CreateEventInput>
  ): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    // Bangun object update dengan mapping camelCase → snake_case
    // Gunakan tipe Database['Tables']['calendar_events']['Update'] untuk type safety
    const updateData: Database["public"]["Tables"]["calendar_events"]["Update"] = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.eventDate !== undefined) updateData.event_date = input.eventDate;
    if (input.endDate !== undefined) updateData.end_date = input.endDate;
    if (input.tipe !== undefined) updateData.tipe = input.tipe;
    if (input.studentId !== undefined) updateData.student_id = input.studentId;

    const { error } = await supabase
      .from("calendar_events")
      .update(updateData)
      .eq("id", id);

    if (error) {
      console.error("[SupabaseCalendarRepository] updateEvent error:", error.message);
      return { error: error.message };
    }

    revalidatePath("/dashboard/admin/kalender");
    revalidatePath("/dashboard/siswa/kalender");

    return {};
  }

  // -----------------------------------------------------------
  // deleteEvent — Hapus event kalender
  // -----------------------------------------------------------
  /**
   * deleteEvent — Menghapus event dari tabel calendar_events berdasarkan ID.
   *
   * @param id — UUID event yang akan dihapus
   * @returns { error?: string }
   */
  async deleteEvent(id: string): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("calendar_events")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[SupabaseCalendarRepository] deleteEvent error:", error.message);
      return { error: error.message };
    }

    revalidatePath("/dashboard/admin/kalender");
    revalidatePath("/dashboard/siswa/kalender");

    return {};
  }

  // -----------------------------------------------------------
  // getAdminStats — Statistik untuk dashboard admin
  // -----------------------------------------------------------
  /**
   * getAdminStats — Mengembalikan statistik ringkasan untuk dashboard admin.
   * Tiga query COUNT dijalankan secara paralel via Promise.all.
   *
   * @returns { totalEvents, upcomingEvents, totalSiswa }
   */
  async getAdminStats(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    totalSiswa: number;
  }> {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    const [
      { count: totalEvents, error: errTotal },
      { count: upcomingEvents, error: errUpcoming },
      { count: totalSiswa, error: errSiswa },
    ] = await Promise.all([
      supabase.from("calendar_events").select("*", { count: "exact", head: true }),
      supabase
        .from("calendar_events")
        .select("*", { count: "exact", head: true })
        .gte("event_date", today),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "siswa"),
    ]);

    if (errTotal || errUpcoming || errSiswa) {
      console.error("[SupabaseCalendarRepository] getAdminStats error:", {
        total: errTotal?.message,
        upcoming: errUpcoming?.message,
        siswa: errSiswa?.message,
      });
    }

    return {
      totalEvents: totalEvents ?? 0,
      upcomingEvents: upcomingEvents ?? 0,
      totalSiswa: totalSiswa ?? 0,
    };
  }

  // -----------------------------------------------------------
  // getUpcomingEvents — Ambil event mendatang (untuk widget)
  // -----------------------------------------------------------
  /**
   * getUpcomingEvents — Mengambil event-event yang akan datang
   * (event_date >= hari ini), diurutkan dari yang terdekat.
   *
   * @param limit — Jumlah maksimal event yang dikembalikan
   * @returns Array CalendarEvent — event mendatang
   */
  async getUpcomingEvents(limit: number): Promise<CalendarEvent[]> {
    const supabase = createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("calendar_events")
      .select("*, profiles!left(full_name, identity_number)")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(limit);

    if (error) {
      console.error("[SupabaseCalendarRepository] getUpcomingEvents error:", error.message);
      return [];
    }

    return (data ?? []).map((row) => this.mapEvent(row as unknown as CalendarEventQueryResult));
  }

  // -----------------------------------------------------------
  // getStudentAttendanceByMonth — Data presensi & izin bulanan
  // -----------------------------------------------------------
  /**
   * getStudentAttendanceByMonth — Mengambil data presensi (attendance_records)
   * dan izin yang disetujui (leave_requests) untuk satu siswa dalam satu bulan.
   *
   * Juga menyertakan tanggal pendaftaran siswa (studentSince) yang diambil
   * dari profiles.created_at, berguna untuk menentukan kapan siswa mulai
   * bertanggung jawab atas presensi.
   *
   * Alur:
   * 1. Ambil profiles.created_at → studentSince
   * 2. Ambil attendance_records dalam rentang bulan → records
   * 3. Ambil leave_requests (status = disetujui) yang overlap dengan bulan → leaves
   *
   * @param studentId — UUID siswa
   * @param year — Tahun
   * @param month — Bulan (1-12)
   * @returns MonthlyAttendance — records, leaves, dan studentSince
   */
  async getStudentAttendanceByMonth(
    studentId: string,
    year: number,
    month: number
  ): Promise<MonthlyAttendance> {
    const supabase = createClient();
    const [start, end] = this.getMonthRange(year, month);

    // -------------------------------------------------------
    // 1. Ambil tanggal pendaftaran siswa (studentSince)
    // -------------------------------------------------------
    // Digunakan untuk memfilter tanggal sebelum siswa terdaftar
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("created_at")
      .eq("id", studentId)
      .single();

    if (profileError) {
      console.error(
        "[SupabaseCalendarRepository] getStudentAttendanceByMonth — Gagal ambil profile:",
        profileError.message
      );
    }

    const studentSince = profile?.created_at ?? null;

    // -------------------------------------------------------
    // 2. Ambil attendance_records dalam rentang bulan
    // -------------------------------------------------------
    const { data: records, error: recordsError } = await supabase
      .from("attendance_records")
      .select("scanned_at, status")
      .eq("student_id", studentId)
      .gte("scanned_at", start)
      .lte("scanned_at", end);

    if (recordsError) {
      console.error(
        "[SupabaseCalendarRepository] getStudentAttendanceByMonth — Gagal ambil records:",
        recordsError.message
      );
    }

    // -------------------------------------------------------
    // 3. Ambil leave_requests yang disetujui dan overlap bulan
    // -------------------------------------------------------
    // Overlap: leave.start_date <= end && leave.end_date >= start
    const { data: leaves, error: leavesError } = await supabase
      .from("leave_requests")
      .select("start_date, end_date, type, status")
      .eq("student_id", studentId)
      .eq("status", "disetujui")
      .lte("start_date", end)
      .gte("end_date", start);

    if (leavesError) {
      console.error(
        "[SupabaseCalendarRepository] getStudentAttendanceByMonth — Gagal ambil leaves:",
        leavesError.message
      );
    }

    // Map snake_case → camelCase untuk records
    const mappedRecords = (records ?? []).map((r) => ({
      scannedAt: r.scanned_at,
      status: r.status,
    }));

    // Map snake_case → camelCase untuk leaves
    const mappedLeaves = (leaves ?? []).map((l) => ({
      startDate: l.start_date,
      endDate: l.end_date,
      type: l.type,
      status: l.status,
    }));

    return {
      records: mappedRecords,
      leaves: mappedLeaves,
      studentSince,
    };
  }
}
