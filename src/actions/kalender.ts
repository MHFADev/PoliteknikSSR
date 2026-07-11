/*
 * kalender.ts — Manajemen Kalender Akademik
 * ==========================================
 * Server actions untuk CRUD event kalender, statistik dashboard,
 * serta data presensi per bulan untuk tampilan kalender siswa.
 *
 * Alur:
 * - getEvents / getAllEvents → query event (dengan filter per siswa)
 * - addEvent / updateEvent / deleteEvent → CRUD event (Admin)
 * - getStudentAttendanceByMonth → data presensi + izin untuk kalender siswa
 * - getAdminCalendarStats → statistik dashboard admin
 * - getStudents → daftar siswa (untuk komponen autocomplete/lookup)
 * - getUpcomingEvents → event mendatang (untuk widget sidebar)
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * getEvents — Ambil event kalender per bulan
 * @param year - Tahun
 * @param month - Bulan (1-12)
 * @param studentId - Jika diisi, filter event milik siswa tsb + event umum (student_id is null)
 * @returns Array event dalam rentang bulan yang diminta
 */
export async function getEvents(year: number, month: number, studentId?: string | null) {
  const supabase = createClient();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);

  let query = supabase
    .from("calendar_events")
    .select("*, profiles!left(full_name, identity_number)")
    .gte("event_date", start)
    .lte("event_date", end)
    .order("event_date", { ascending: true });

  if (studentId) {
    // Tampilkan event milik siswa + event umum
    query = query.or(`student_id.eq.${studentId},student_id.is.null`);
  }

  const { data } = await query;
  return data ?? [];
}

/**
 * getAllEvents — Ambil semua event (dengan pencarian opsional)
 * @param search - Kata kunci pencarian (title atau nama siswa)
 * @returns Array semua event
 */
export async function getAllEvents(search?: string) {
  const supabase = createClient();

  let query = supabase
    .from("calendar_events")
    .select("*, profiles!left(full_name, identity_number, study_programs!left(nama))")
    .order("event_date", { ascending: false });

  if (search) {
    query = query.or(
      `title.ilike.%${search}%,profiles.full_name.ilike.%${search}%`
    );
  }

  const { data } = await query;
  return data ?? [];
}

/**
 * addEvent — Tambah event baru (Admin only)
 * @param title - Judul event
 * @param description - Deskripsi event
 * @param event_date - Tanggal event
 * @param end_date - Tanggal selesai (opsional, untuk event multi-hari)
 * @param tipe - "libur" atau "event"
 * @param student_id - ID siswa (jika event spesifik untuk siswa tertentu)
 * @returns Object { success, message }
 */
export async function addEvent(
  title: string,
  description: string | null,
  event_date: string,
  end_date: string | null,
  tipe: "libur" | "event",
  student_id: string | null
) {
  const supabase = createAdminClient();
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase.from("calendar_events").insert({
    title,
    description,
    event_date,
    end_date,
    tipe,
    student_id,
    created_by: user.id,
  });

  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/admin/kalender");
  revalidatePath("/dashboard/siswa/kalender");
  return { success: true };
}

/**
 * updateEvent — Update event yang sudah ada (Admin only)
 */
export async function updateEvent(
  id: string,
  title: string,
  description: string | null,
  event_date: string,
  end_date: string | null,
  tipe: "libur" | "event",
  student_id: string | null
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("calendar_events")
    .update({ title, description, event_date, end_date, tipe, student_id })
    .eq("id", id);

  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/admin/kalender");
  revalidatePath("/dashboard/siswa/kalender");
  return { success: true };
}

/**
 * deleteEvent — Hapus event (Admin only)
 */
export async function deleteEvent(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);

  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/admin/kalender");
  revalidatePath("/dashboard/siswa/kalender");
  return { success: true };
}

/**
 * getStudentAttendanceByMonth — Ambil data presensi + izin siswa per bulan
 * @param studentId - ID siswa
 * @param year - Tahun
 * @param month - Bulan (1-12)
 * @returns Object { records, leaves } — data untuk ditampilkan di kalender siswa
 *
 * Alur:
 * 1. Ambil semua attendance_records siswa dalam rentang bulan
 * 2. Ambil semua leave_requests yang disetujui dalam rentang bulan
 */
export async function getStudentAttendanceByMonth(studentId: string, year: number, month: number) {
  const supabase = createClient();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);

  const { data: records } = await supabase
    .from("attendance_records")
    .select("scanned_at, status")
    .eq("student_id", studentId)
    .gte("scanned_at", start)
    .lte("scanned_at", end);

  const { data: leaves } = await supabase
    .from("leave_requests")
    .select("start_date, end_date, type, status")
    .eq("student_id", studentId)
    .eq("status", "disetujui")
    .lte("start_date", end)
    .gte("end_date", start);

  return { records: records ?? [], leaves: leaves ?? [] };
}

/**
 * getAdminCalendarStats — Statistik untuk dashboard admin
 * @returns Object { totalEvents, upcomingEvents, totalSiswa }
 * Query dilakukan paralel via Promise.all untuk efisiensi
 */
export async function getAdminCalendarStats() {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: totalEvents }, { count: upcomingEvents }, { count: totalSiswa }] =
    await Promise.all([
      supabase.from("calendar_events").select("*", { count: "exact", head: true }),
      supabase
        .from("calendar_events")
        .select("*", { count: "exact", head: true })
        .gte("event_date", today),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "siswa"),
    ]);

  return {
    totalEvents: totalEvents ?? 0,
    upcomingEvents: upcomingEvents ?? 0,
    totalSiswa: totalSiswa ?? 0,
  };
}

/**
 * getStudents — Ambil daftar siswa (untuk komponen form/lookup)
 * @returns Array profil siswa
 */
export async function getStudents() {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, identity_number, kelas, jurusan_id, study_programs!left(nama)")
    .eq("role", "siswa")
    .order("full_name", { ascending: true });
  return data ?? [];
}

/**
 * getUpcomingEvents — Ambil event mendatang (untuk widget)
 * @param limit - Jumlah maksimal event
 * @returns Array event yang akan datang (terdekat)
 */
export async function getUpcomingEvents(limit = 5) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("calendar_events")
    .select("*, profiles!left(full_name, identity_number)")
    .gte("event_date", today)
    .order("event_date", { ascending: true })
    .limit(limit);

  return data ?? [];
}
