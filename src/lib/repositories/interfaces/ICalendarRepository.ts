// ============================================================
// ICalendarRepository — Interface Repository untuk Kalender
// ============================================================
// Menangani event kalender (libur nasional, event kampus, event
// khusus siswa) serta ringkasan presensi bulanan per siswa.
//
// Event dengan studentId = null berlaku untuk semua siswa (global).
// Event dengan studentId terisi hanya tampil untuk siswa tsb.
// ============================================================

import type {
  CalendarEvent,
  CreateEventInput,
  MonthlyAttendance,
} from "../types";

export interface ICalendarRepository {
  /**
   * getEvents — Ambil event dalam bulan & tahun tertentu
   * @param year — Tahun (contoh: 2025)
   * @param month — Bulan (1-12)
   * @param studentId — Filter event khusus siswa (null = semua event)
   * @returns Array event kalender
   */
  getEvents(
    year: number,
    month: number,
    studentId?: string | null
  ): Promise<CalendarEvent[]>;

  /**
   * getAllEvents — Ambil semua event (untuk dashboard admin)
   * @param search — Teks pencarian (opsional, filter berdasarkan title)
   * @returns Array semua event
   */
  getAllEvents(search?: string): Promise<CalendarEvent[]>;

  /**
   * createEvent — Buat event kalender baru
   * @param input — Data event (CreateEventInput)
   * @returns ID event atau error
   */
  createEvent(input: CreateEventInput): Promise<{ id?: string; error?: string }>;

  /**
   * updateEvent — Update event kalender
   * @param id — UUID event
   * @param input — Data partial yang akan diupdate
   */
  updateEvent(
    id: string,
    input: Partial<CreateEventInput>
  ): Promise<{ error?: string }>;

  /**
   * deleteEvent — Hapus event kalender
   * @param id — UUID event
   */
  deleteEvent(id: string): Promise<{ error?: string }>;

  /**
   * getAdminStats — Statistik untuk dashboard admin
   * @returns totalEvents, upcomingEvents, totalSiswa
   */
  getAdminStats(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    totalSiswa: number;
  }>;

  /**
   * getUpcomingEvents — Ambil event mendatang (terbatas)
   * @param limit — Jumlah maksimal event yang diambil
   * @returns Array event mendatang
   */
  getUpcomingEvents(limit: number): Promise<CalendarEvent[]>;

  /**
   * getStudentAttendanceByMonth — Data presensi & izin bulanan siswa
   * @param studentId — UUID siswa
   * @param year — Tahun
   * @param month — Bulan (1-12)
   * @returns Object berisi records & leaves
   */
  getStudentAttendanceByMonth(
    studentId: string,
    year: number,
    month: number
  ): Promise<MonthlyAttendance>;
}
