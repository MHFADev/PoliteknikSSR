"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function gradeFromScore(score: number): string {
  if (score >= 85) return "A";
  if (score >= 80) return "A-";
  if (score >= 75) return "B+";
  if (score >= 70) return "B";
  if (score >= 65) return "B-";
  if (score >= 60) return "C+";
  if (score >= 55) return "C";
  if (score >= 50) return "C-";
  if (score >= 45) return "D+";
  if (score >= 40) return "D";
  return "E";
}

export const SIFAT_OPTIONS = ["Praktik", "Teori", "Produk", "Sikap", "Portofolio", "Proyek", "Laporan", "Presentasi"] as const;

export interface GradeSubject {
  name: string;
  score: number;
  grade: string;
  sifat: string;
}

export interface GradeData {
  subjects: GradeSubject[];
  notes: string;
  pklStartDate: string;
  pklEndDate: string;
}

export async function sendCertificate(
  studentId: string,
  formData: FormData
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "File tidak ditemukan." };

    const ext = file.name.split(".").pop();
    const timestamp = Date.now();
    const filePath = `${studentId}/certificate_${timestamp}.${ext}`;

    const adminSupabase = createAdminClient();
    const { error: uploadError } = await adminSupabase.storage
      .from("student-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) return { success: false, message: uploadError.message };

    const { data: urlData } = adminSupabase.storage
      .from("student-documents")
      .getPublicUrl(filePath);

    const { error: dbError } = await adminSupabase
      .from("student_documents")
      .insert({
        student_id: studentId,
        admin_id: user.id,
        type: "certificate",
        file_url: urlData.publicUrl,
        file_name: file.name,
      });

    if (dbError) {
      await adminSupabase.storage.from("student-documents").remove([filePath]);
      return { success: false, message: dbError.message };
    }

    revalidatePath("/dashboard/admin/sertifikat-rekap");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || "Gagal mengirim sertifikat." };
  }
}

export async function sendGradeSummary(
  studentId: string,
  gradeData: GradeData,
  file: File | null
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const adminSupabase = createAdminClient();
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      const ext = file.name.split(".").pop();
      const timestamp = Date.now();
      const filePath = `${studentId}/grade_${timestamp}.${ext}`;

      const { error: uploadError } = await adminSupabase.storage
        .from("student-documents")
        .upload(filePath, file, { upsert: true });

      if (uploadError) return { success: false, message: uploadError.message };

      const { data: urlData } = adminSupabase.storage
        .from("student-documents")
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
      fileName = file.name;
    }

    const { error: dbError } = await adminSupabase
      .from("student_documents")
      .insert({
        student_id: studentId,
        admin_id: user.id,
        type: "grade_summary",
        file_url: fileUrl,
        file_name: fileName,
        grade_data: gradeData,
      });

    if (dbError) return { success: false, message: dbError.message };

    revalidatePath("/dashboard/admin/sertifikat-rekap");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || "Gagal mengirim rekap nilai." };
  }
}

export async function getStudents(): Promise<
  { id: string; fullName: string; kelas: string | null; identityNumber: string | null }[]
> {
  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from("profiles")
    .select("id, full_name, kelas, identity_number")
    .eq("role", "siswa")
    .eq("approved", true)
    .order("full_name", { ascending: true });

  return (data || []).map((s) => ({
    id: s.id,
    fullName: s.full_name,
    kelas: s.kelas,
    identityNumber: s.identity_number,
  }));
}

export async function getSentDocuments(): Promise<
  {
    id: string;
    type: string;
    studentName: string;
    fileName: string | null;
    isRead: boolean;
    isKept: boolean;
    createdAt: string;
    expiresAt: string;
  }[]
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from("student_documents")
    .select("id, type, file_name, is_read, is_kept, created_at, expires_at, profiles!inner(full_name)")
    .eq("admin_id", user.id)
    .order("created_at", { ascending: false });

  return (data || []).map((d: any) => ({
    id: d.id,
    type: d.type,
    studentName: d.profiles.full_name,
    fileName: d.file_name,
    isRead: d.is_read,
    isKept: d.is_kept,
    createdAt: d.created_at,
    expiresAt: d.expires_at,
  }));
}

export async function markAsRead(documentId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("student_documents")
    .update({ is_read: true })
    .eq("id", documentId)
    .eq("student_id", user.id);
}

export async function toggleKeepDocument(
  documentId: string,
  keep: boolean
): Promise<{ success: boolean; message?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const { error } = await supabase
    .from("student_documents")
    .update({ is_kept: keep })
    .eq("id", documentId)
    .eq("student_id", user.id);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function getStudentDocuments(): Promise<
  {
    id: string;
    type: "certificate" | "grade_summary";
    fileUrl: string | null;
    fileName: string | null;
    gradeData: GradeData | null;
    isRead: boolean;
    isKept: boolean;
    createdAt: string;
    expiresAt: string;
  }[]
> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  await cleanupExpired();

  const { data } = await supabase
    .from("student_documents")
    .select("*")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  return (data || []).map((d: any) => ({
    id: d.id,
    type: d.type,
    fileUrl: d.file_url,
    fileName: d.file_name,
    gradeData: d.grade_data as GradeData | null,
    isRead: d.is_read,
    isKept: d.is_kept,
    createdAt: d.created_at,
    expiresAt: d.expires_at,
  }));
}

async function cleanupExpired(): Promise<void> {
  try {
    const adminSupabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: expired } = await adminSupabase
      .from("student_documents")
      .select("id, file_url")
      .eq("is_kept", false)
      .lt("expires_at", now);

    if (!expired || expired.length === 0) return;

    const ids = expired.map((d) => d.id);
    const { error: delError } = await adminSupabase
      .from("student_documents")
      .delete()
      .in("id", ids);

    if (delError) return;
  } catch {
    // silent cleanup
  }
}

export async function recalculateGrade(score: number): Promise<string> {
  return gradeFromScore(score);
}
