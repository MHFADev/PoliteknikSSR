"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generatePermanentStudentToken } from "@/lib/qr-token";

export interface AttendanceStats {
  studentId: string;
  fullName: string;
  kelas: string | null;
  jurusan: string | null;
  hadir: number;
  telat: number;
  izin: number;
  sakit: number;
  alfa: number;
  total: number;
}

export async function get30DayAttendanceStats(studentId?: string): Promise<AttendanceStats[]> {
  const supabase = createAdminClient();
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
  
  // Get all students
  let studentsQuery = supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      kelas,
      jurusan_id,
      study_programs ( nama )
    `)
    .eq("role", "siswa");
    
  if (studentId) {
    studentsQuery = studentsQuery.eq("id", studentId);
  }
  
  const { data: students, error: studentsError } = await studentsQuery;
  
  if (studentsError || !students) return [];
  
  // Get all attendance records and leave requests from the last 30 days
  const [{ data: records }, { data: leaves }] = await Promise.all([
    supabase
      .from("attendance_records")
      .select("student_id, status, scanned_at")
      .gte("scanned_at", `${startDate}T00:00:00`),
    supabase
      .from("leave_requests")
      .select("student_id, type, start_date, end_date")
      .eq("status", "approved")
      .gte("end_date", startDate)
  ]);
  
  // Calculate stats for each student
  const stats: AttendanceStats[] = students.map(student => {
    // Attendance records
    const studentRecords = records?.filter(r => r.student_id === student.id) || [];
    const hadir = studentRecords.filter(r => r.status === "hadir").length;
    const telat = studentRecords.filter(r => r.status === "telat").length;
    
    // Leave requests - count days (simplified)
    const studentLeaves = leaves?.filter(l => l.student_id === student.id) || [];
    let izin = 0;
    let sakit = 0;
    
    studentLeaves.forEach(leave => {
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      let days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      // Limit to last 30 days
      const startLimit = new Date(startDate);
      if (start < startLimit) {
        days = Math.ceil((end.getTime() - startLimit.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      if (leave.type === "izin") izin += days;
      if (leave.type === "sakit") sakit += days;
    });
    
    // Count alfa
    const endDate = new Date();
    let totalDays = Math.ceil((endDate.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    totalDays = Math.max(totalDays, 1);
    const alfa = Math.max(0, totalDays - (hadir + telat + izin + sakit));
    
    return {
      studentId: student.id,
      fullName: student.full_name,
      kelas: student.kelas,
      jurusan: student.study_programs?.nama || null,
      hadir,
      telat,
      izin,
      sakit,
      alfa,
      total: totalDays
    };
  });
  
  return stats;
}

interface AddStudentArgs {
  fullName: string;
  email: string;
  password: string;
  identityNumber?: string;
  instansi?: string;
  kelas?: string;
  jurusanId?: string;
}

export async function addStudent({
  fullName,
  email,
  password,
  identityNumber,
  instansi,
  kelas,
  jurusanId,
}: AddStudentArgs): Promise<{ success: true; studentId: string; permanentToken: string } | { success: false; message: string }> {
  const supabase = createAdminClient();

  const { data: { user: authUser }, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "siswa",
    },
  });

  if (authError) {
    return { success: false, message: "Gagal membuat akun: " + authError.message };
  }

  const studentId = authUser!.id;

  // Update the profile with additional info (since handle_new_user might miss some fields)
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      identity_number: identityNumber || null,
      instansi: instansi || null,
      kelas: kelas || null,
      jurusan_id: jurusanId || null,
    })
    .eq("id", studentId);

  if (profileError) {
    return { success: false, message: "Gagal menyimpan data siswa: " + profileError.message };
  }

  const permanentToken = await generatePermanentStudentToken(studentId, process.env.QR_SIGNING_SECRET!);

  revalidatePath("/dashboard/admin/pengguna");

  return { success: true, studentId, permanentToken };
}

export async function ensureStudyProgram(
  nama: string
): Promise<{ id: string | null; error?: string }> {
  const supabase = createAdminClient();
  const trimmed = nama.trim();
  if (!trimmed) return { id: null };

  const { data: existing } = await supabase
    .from("study_programs")
    .select("id")
    .ilike("nama", trimmed)
    .maybeSingle();

  if (existing) return { id: existing.id };

  const kode = trimmed
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 10);

  const { data, error } = await supabase
    .from("study_programs")
    .insert({ nama: trimmed, kode })
    .select("id")
    .single();

  if (error) return { id: null, error: error.message };
  return { id: data.id };
}
