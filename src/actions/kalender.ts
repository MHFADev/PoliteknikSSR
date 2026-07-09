"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getEvents(year: number, month: number) {
  const supabase = createClient();

  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const endDate = new Date(year, month, 0);
  const end = endDate.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("event_date", start)
    .lte("event_date", end)
    .order("event_date", { ascending: true });

  return data ?? [];
}

export async function getAllEvents() {
  const supabase = createClient();
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .order("event_date", { ascending: false });
  return data ?? [];
}

export async function addEvent(
  title: string,
  description: string | null,
  event_date: string,
  end_date: string | null,
  tipe: "libur" | "event"
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
  tipe: "libur" | "event"
) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("calendar_events")
    .update({ title, description, event_date, end_date, tipe })
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
