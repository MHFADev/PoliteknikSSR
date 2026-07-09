"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
    query = query.or(`student_id.eq.${studentId},student_id.is.null`);
  }

  const { data } = await query;
  return data ?? [];
}

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

export async function deleteEvent(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);

  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/admin/kalender");
  revalidatePath("/dashboard/siswa/kalender");
  return { success: true };
}

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

export async function getAdminCalendarStats() {
  const supabase = createClient();

  const today = new Date().toISOString().slice(0, 10);
  const startOfMonth = `${today.slice(0, 7)}-01`;

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

export async function getStudents() {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, identity_number, kelas, jurusan_id, study_programs!left(nama)")
    .eq("role", "siswa")
    .order("full_name", { ascending: true });
  return data ?? [];
}

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
