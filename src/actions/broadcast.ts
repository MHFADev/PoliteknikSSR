/*
 * broadcast.ts — Manajemen Pengumuman (Broadcast)
 * ==========================================
 * Server actions untuk CRUD pengumuman dan daftar program studi.
 * Admin bisa mengirim pengumuman ke semua siswa atau per program studi.
 *
 * Alur:
 * - getStudyPrograms / getAnnouncements → query read-only (client)
 * - getAnnouncementsForStudent → filter pengumuman 2 hari terakhir
 *   yang relevan untuk siswa tertentu
 * - sendAnnouncement → insert pengumuman + recipients (jika tidak broadcast_to_all)
 * - deleteAnnouncement → hapus pengumuman
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * getStudyPrograms — Ambil semua program studi (urut alphabetical)
 * @returns Array program studi
 */
export async function getStudyPrograms() {
  const supabase = createClient();
  const { data } = await supabase
    .from("study_programs")
    .select("*")
    .order("nama", { ascending: true });
  return data ?? [];
}

/**
 * getAnnouncements — Ambil semua pengumuman dengan recipient-nya
 * @returns Array pengumuman (termasuk relasi announcement_recipients)
 */
export async function getAnnouncements() {
  const supabase = createClient();
  const { data } = await supabase
    .from("announcements")
    .select("*, announcement_recipients(study_program_id)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

/**
 * getAnnouncementsForStudent — Ambil pengumuman relevan untuk siswa
 * @param studentId - ID siswa (tidak dipakai langsung, disediakan untuk konteks)
 * @param jurusanId - ID program studi siswa untuk filter recipient
 * @returns Array pengumuman dalam 2 hari terakhir yang relevan
 *
 * Alur:
 * 1. Ambil semua pengumuman (termasuk recipients)
 * 2. Filter yang dibuat dalam 2 hari terakhir
 * 3. Filter: broadcast_to_all → tampilkan, atau siswa masuk recipient
 */
export async function getAnnouncementsForStudent(studentId: string, jurusanId: string | null) {
  const supabase = createClient();

  const { data } = await supabase
    .from("announcements")
    .select("id, title, content, broadcast_to_all, created_at, announcement_recipients(study_program_id)")
    .order("created_at", { ascending: false });

  if (!data) return [];

  // --- Filter pengumuman 2 hari terakhir ---
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  twoDaysAgo.setHours(0, 0, 0, 0);

  return data.filter((a: any) => {
    const createdAt = new Date(a.created_at);
    if (createdAt < twoDaysAgo) return false;

    if (a.broadcast_to_all) return true;
    if (!jurusanId) return false;
    return a.announcement_recipients?.some((r: any) => r.study_program_id === jurusanId);
  });
}

/**
 * sendAnnouncement — Kirim pengumuman baru
 * @param title - Judul pengumuman
 * @param content - Isi pengumuman
 * @param broadcastToAll - Jika true, kirim ke semua siswa
 * @param studyProgramIds - Daftar ID program studi tujuan (jika tidak broadcast ke semua)
 * @returns Object { success, message }
 *
 * Alur:
 * 1. Insert pengumuman ke tabel announcements
 * 2. Jika tidak broadcast_to_all, insert recipients per program studi
 * 3. Revalidate path admin & siswa
 */
export async function sendAnnouncement(
  title: string,
  content: string,
  broadcastToAll: boolean,
  studyProgramIds: string[]
) {
  const supabase = createAdminClient();
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  // --- Insert pengumuman ---
  const { data: announcement, error: insertError } = await supabase
    .from("announcements")
    .insert({
      title,
      content,
      broadcast_to_all: broadcastToAll,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertError) return { success: false, message: insertError.message };

  // --- Insert recipients jika tidak broadcast ke semua ---
  if (!broadcastToAll && studyProgramIds.length > 0) {
    const recipients = studyProgramIds.map((spId) => ({
      announcement_id: announcement.id,
      study_program_id: spId,
    }));

    const { error: recipientsError } = await supabase
      .from("announcement_recipients")
      .insert(recipients);

    if (recipientsError) return { success: false, message: recipientsError.message };
  }

  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/siswa/pengumuman");
  return { success: true };
}

/**
 * deleteAnnouncement — Hapus pengumuman berdasarkan ID
 * @param id - ID pengumuman
 * @returns Object { success, message }
 */
export async function deleteAnnouncement(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("announcements").delete().eq("id", id);

  if (error) return { success: false, message: error.message };
  revalidatePath("/dashboard/admin/broadcast");
  revalidatePath("/dashboard/siswa/pengumuman");
  return { success: true };
}
