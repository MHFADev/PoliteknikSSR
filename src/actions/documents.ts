"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { PrakerinRecapData } from "@/lib/types";
import { uploadToGitHub } from "@/lib/github-storage";

export type { PrakerinRecapData } from "@/lib/types";

export async function sendCertificate(
  studentId: string,
  formData: FormData
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const file = formData.get("file") as File;
    if (!file) return { success: false, message: "File tidak ditemukan." };

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const result = await uploadToGitHub(buffer, file.name, "student-documents", studentId);
    if (result.error) return { success: false, message: result.error };

    const adminSupabase = createAdminClient();
    const { error: dbError } = await adminSupabase
      .from("student_documents")
      .insert({
        student_id: studentId,
        admin_id: user.id,
        type: "certificate",
        file_url: result.url,
        file_name: file.name,
      });

    if (dbError) return { success: false, message: dbError.message };

    revalidatePath("/dashboard/admin/sertifikat-rekap");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || "Gagal mengirim sertifikat." };
  }
}

export async function sendPrakerinRecap(
  studentId: string,
  prakerinData: PrakerinRecapData,
  file: File | null
): Promise<{ success: true } | { success: false; message: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, message: "Unauthorized" };

    const adminSupabase = createAdminClient();
    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await uploadToGitHub(buffer, file.name, "student-documents", studentId);
      if (result.error) return { success: false, message: result.error };
      fileUrl = result.url;
      fileName = file.name;
    }

    const { error: dbError } = await adminSupabase
      .from("student_documents")
      .insert({
        student_id: studentId,
        admin_id: user.id,
        type: "prakerin_recap",
        file_url: fileUrl,
        file_name: fileName,
        grade_data: prakerinData as any,
      });

    if (dbError) return { success: false, message: dbError.message };

    revalidatePath("/dashboard/admin/sertifikat-rekap");
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message || "Gagal mengirim rekap prakerin." };
  }
}

export async function getStudents(): Promise<
  { id: string; fullName: string; kelas: string | null; identityNumber: string | null; instansi: string | null; jurusanId: string | null; studyProgramName: string | null }[]
> {
  const adminSupabase = createAdminClient();
  const { data } = await adminSupabase
    .from("profiles")
    .select("id, full_name, kelas, identity_number, instansi, jurusan_id, study_programs!left(nama)")
    .eq("role", "siswa")
    .eq("approved", true)
    .order("full_name", { ascending: true });

  return (data || []).map((s: any) => ({
    id: s.id,
    fullName: s.full_name,
    kelas: s.kelas,
    identityNumber: s.identity_number,
    instansi: s.instansi,
    jurusanId: s.jurusan_id,
    studyProgramName: s.study_programs?.nama || null,
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
    type: "certificate" | "prakerin_recap";
    fileUrl: string | null;
    fileName: string | null;
    gradeData: PrakerinRecapData | null;
    isRead: boolean;
    isKept: boolean;
    createdAt: string;
    expiresAt: string;
  }[]
> {
  const supabase = await createClient();
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
    gradeData: d.grade_data as PrakerinRecapData | null,
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

    await adminSupabase
      .from("student_documents")
      .delete()
      .eq("is_kept", false)
      .lt("expires_at", now);
  } catch {
    // silent cleanup
  }
}


