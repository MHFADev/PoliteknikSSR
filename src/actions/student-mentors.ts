"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface MentorInfo {
  id: string;
  fullName: string;
  jurusan: string | null;
  avatarUrl: string | null;
  studyProgramName: string | null;
}

export interface StudentMentorInfo {
  studentId: string;
  mentorId: string;
  assignedAt: string;
  mentorName: string;
  mentorJurusan: string | null;
  mentorAvatarUrl: string | null;
  studyProgramName: string | null;
}

/**
 * Get available pembimbing for a specific jurusan.
 * Used by siswa to pick their pembimbing.
 */
export async function getAvailableMentors(jurusanId?: string): Promise<MentorInfo[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const adminSupabase = createAdminClient();

  let query = adminSupabase
    .from("profiles")
    .select("id, full_name, avatar_url, jurusan_id, study_programs!left(nama)")
    .eq("role", "pembimbing")
    .eq("approved", true);

  if (jurusanId) {
    query = query.eq("jurusan_id", jurusanId);
  }

  const { data } = await query.order("full_name", { ascending: true });

  return (data || []).map((m: any) => ({
    id: m.id,
    fullName: m.full_name,
    jurusan: m.jurusan_id,
    avatarUrl: m.avatar_url,
    studyProgramName: m.study_programs?.nama || null,
  }));
}

/**
 * Get the current student's assigned mentor.
 */
export async function getMyMentor(): Promise<StudentMentorInfo | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("student_mentors")
    .select("student_id, mentor_id, assigned_at, profiles!inner(full_name, avatar_url, jurusan_id, study_programs!left(nama))")
    .eq("student_id", user.id)
    .single() as { data: any };

  if (!data) return null;

  return {
    studentId: data.student_id,
    mentorId: data.mentor_id,
    assignedAt: data.assigned_at,
    mentorName: data.profiles?.full_name,
    mentorJurusan: data.profiles?.jurusan_id,
    mentorAvatarUrl: data.profiles?.avatar_url,
    studyProgramName: data.profiles?.study_programs?.nama || null,
  };
}

/**
 * Select (or change) a mentor for the current student.
 */
export async function selectMentor(mentorId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    // Verify the mentor exists and is approved
    const adminSupabase = createAdminClient();
    const { data: mentor } = await adminSupabase
      .from("profiles")
      .select("id, role, approved")
      .eq("id", mentorId)
      .single();

    if (!mentor || mentor.role !== "pembimbing" || !mentor.approved) {
      return { success: false, message: "Pembimbing tidak ditemukan atau belum disetujui." };
    }

    // Upsert the student_mentors record (one student = one mentor)
    const { error } = await supabase
      .from("student_mentors")
      .upsert(
        { student_id: user.id, mentor_id: mentorId },
        { onConflict: "student_id,mentor_id" }
      );

    if (error) {
      return { success: false, message: error.message };
    }

    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard/pembimbing");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || "Gagal memilih pembimbing." };
  }
}

/**
 * Get all students assigned to the current mentor (pembimbing view).
 */
export async function getMyStudents(): Promise<
  {
    id: string;
    fullName: string;
    kelas: string | null;
    identityNumber: string | null;
    avatarUrl: string | null;
    studyProgramName: string | null;
    instansi: string | null;
    assignedAt: string;
  }[]
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("student_mentors")
    .select("student_id, assigned_at, profiles!inner(id, full_name, kelas, identity_number, avatar_url, instansi, study_programs!left(nama))")
    .eq("mentor_id", user.id) as { data: any[] | null };

  return (data || []).map((sm: any) => ({
    id: sm.profiles.id,
    fullName: sm.profiles.full_name,
    kelas: sm.profiles.kelas,
    identityNumber: sm.profiles.identity_number,
    avatarUrl: sm.profiles.avatar_url,
    studyProgramName: sm.profiles.study_programs?.nama || null,
    instansi: sm.profiles.instansi,
    assignedAt: sm.assigned_at,
  }));
}

/**
 * Remove a student from mentor (pembimbing can remove their student).
 */
export async function removeStudentFromMentor(studentId: string): Promise<{ success: boolean; message?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const { error } = await supabase
      .from("student_mentors")
      .delete()
      .eq("student_id", studentId)
      .eq("mentor_id", user.id);

    if (error) return { success: false, message: error.message };

    revalidatePath("/dashboard/siswa");
    revalidatePath("/dashboard/pembimbing");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || "Gagal menghapus siswa." };
  }
}
