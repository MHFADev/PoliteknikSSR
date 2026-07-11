"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";

export async function getEvents(year: number, month: number, studentId?: string | null) {
  return Repositories.calendar().getEvents(year, month, studentId);
}

export async function getAllEvents(search?: string) {
  return Repositories.calendar().getAllEvents(search);
}

export async function addEvent(
  title: string,
  description: string | null,
  event_date: string,
  end_date: string | null,
  tipe: "libur" | "event",
  student_id: string | null
) {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const result = await Repositories.calendar().createEvent({
    title,
    description: description ?? null,
    eventDate: event_date,
    endDate: end_date ?? null,
    tipe,
    studentId: student_id ?? null,
    createdBy: user.id,
  });

  if (result.error) return { success: false, message: result.error };

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
  const result = await Repositories.calendar().updateEvent(id, {
    title,
    description: description ?? null,
    eventDate: event_date,
    endDate: end_date ?? null,
    tipe,
    studentId: student_id ?? null,
  });

  if (result.error) return { success: false, message: result.error };

  revalidatePath("/dashboard/admin/kalender");
  revalidatePath("/dashboard/siswa/kalender");
  return { success: true };
}

export async function deleteEvent(id: string) {
  const result = await Repositories.calendar().deleteEvent(id);

  if (result.error) return { success: false, message: result.error };

  revalidatePath("/dashboard/admin/kalender");
  revalidatePath("/dashboard/siswa/kalender");
  return { success: true };
}

export async function getStudentAttendanceByMonth(studentId: string, year: number, month: number) {
  return Repositories.calendar().getStudentAttendanceByMonth(studentId, year, month);
}

export async function getAdminCalendarStats() {
  return Repositories.calendar().getAdminStats();
}

export async function getStudents() {
  return Repositories.users().getAllStudents();
}

export async function getUpcomingEvents(limit = 5) {
  return Repositories.calendar().getUpcomingEvents(limit);
}
