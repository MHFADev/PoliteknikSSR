"use server";

import { Repositories } from "@/lib/repositories";
import { validateEmail } from "@/lib/email-validation";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function register(
  fullName: string,
  email: string,
  password: string,
  role: "siswa" | "pembimbing",
  kelas?: string,
  identityNumber?: string,
  instansi?: string,
  jurusanId?: string
) {
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return { error: emailValidation.error || "Email tidak valid." };
  }

  if (!identityNumber?.trim()) {
    return { error: "Nomor Induk (NISN/NIP) wajib diisi." };
  }

  // Kelas diisi oleh admin di panel, bukan saat register

  if (role === "siswa" && !jurusanId) {
    return { error: "Program studi wajib dipilih untuk siswa." };
  }

  if (role === "pembimbing" && !jurusanId) {
    return { error: "Jurusan yang dibimbing wajib dipilih untuk pembimbing." };
  }

  const result = await Repositories.users().signUp({
    email,
    password,
    fullName,
    role: role as "siswa" | "pembimbing",
    kelas: kelas || undefined,
    identityNumber: identityNumber || undefined,
    instansi: instansi || undefined,
    jurusanId: jurusanId || undefined,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

export async function approveUser(userId: string) {
  const result = await Repositories.users().approveUser(userId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

export async function rejectUser(userId: string) {
  const result = await Repositories.users().rejectUser(userId);
  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard/admin/pengguna");
  return { success: true };
}

export async function getPendingUsers(): Promise<
  | { id: string; email: string; fullName: string; role: string; createdAt: string }[]
  | { error: string }
> {
  try {
    return await Repositories.users().getPendingUsers();
  } catch (err) {
    return { error: "Terjadi kesalahan saat mengambil daftar pengguna." };
  }
}

export async function getStudyPrograms(): Promise<{ id: string; nama: string; kode: string }[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("study_programs")
      .select("id, nama, kode")
      .order("nama", { ascending: true });
    return (data as { id: string; nama: string; kode: string }[]) || [];
  } catch {
    return [];
  }
}