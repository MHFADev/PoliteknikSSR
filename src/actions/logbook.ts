/*
 * logbook.ts — Manajemen Logbook / Kegiatan Harian Siswa
 * ==========================================
 * Server actions untuk menyimpan entri logbook harian siswa,
 * upload foto bukti kegiatan, dan penilaian oleh pembimbing.
 *
 * Alur:
 * - saveLogbookEntry: menyimpan entri kegiatan (upsert per tanggal)
 * - getUploadSignedUrl: membuat signed URL untuk upload foto ke Supabase Storage
 * - gradeLogbookEntry: memberikan nilai & feedback oleh pembimbing/admin
 *
 * Keputusan teknis:
 * - Upsert dengan onConflict("student_id,entry_date") memastikan 1 entri per hari per siswa
 * - Upload foto menggunakan signedURL untuk keamanan (tidak expose credentials client)
 * - Validasi Zod di server sebelum insert/update
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Schema validasi entri logbook
 * - content minimal 20 karakter agar bermakna
 * - photoUrl opsional
 */
const entrySchema = z.object({
  entry_date: z.string(),
  content: z.string().min(20, "Isi logbook minimal 20 karakter agar bermakna."),
  photoUrl: z.string().optional().nullable(),
});

/**
 * saveLogbookEntry — Simpan entri logbook harian (siswa)
 * @param input - Data entri (entry_date, content, photoUrl)
 * @returns Object { success } atau { error }
 *
 * Alur:
 * 1. Validasi input Zod
 * 2. Cek sesi login
 * 3. Upsert ke logbook_entries (1 entri per tanggal per siswa)
 * 4. Revalidate halaman kegiatan harian siswa
 */
export async function saveLogbookEntry(input: z.infer<typeof entrySchema>) {
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  // --- Upsert: 1 entri per siswa per tanggal (lihat unique constraint di schema.sql) ---
  const { error } = await supabase.from("logbook_entries").upsert(
    {
      student_id: user.id,
      entry_date: parsed.data.entry_date,
      content: parsed.data.content,
      photo_url: parsed.data.photoUrl ?? null,
      updated_at: new Date().toISOString(),
    } as any,
    { onConflict: "student_id,entry_date" }
  );

  if (error) return { error: "Gagal menyimpan logbook: " + error.message };

  revalidatePath("/dashboard/siswa/kegiatan-harian");
  return { success: true };
}

/**
 * getUploadSignedUrl — Buat signed URL untuk upload foto ke Supabase Storage
 * @param userId - ID user (untuk path folder)
 * @param entryDate - Tanggal entri (untuk path folder)
 * @returns Object { signedUrl, path } atau { error }
 *
 * Path file: {userId}/{entryDate}/proof.jpg
 * Ini dipanggil dari client component untuk upload langsung ke storage
 */
export async function getUploadSignedUrl(userId: string, entryDate: string) {
  const supabase = createClient();
  
  const fileExtension = "jpg";
  const fileName = `${userId}/${entryDate}/proof.${fileExtension}`;
  
  const { data, error } = await supabase.storage
    .from("logbook_photos")
    .createSignedUploadUrl(fileName, { upsert: true });
    
  if (error) {
    return { error: "Gagal membuat URL upload: " + error.message };
  }
  
  return { signedUrl: data.signedUrl, path: fileName };
}

const gradeSchema = z.object({
  id: z.string().uuid(),
  grade: z.number().min(0).max(100),
  feedback: z.string().max(1000).optional(),
});

/**
 * gradeLogbookEntry — Beri nilai & feedback pada entri logbook (pembimbing/admin)
 * @param input - { id, grade (0-100), feedback (opsional) }
 * @returns Object { success } atau { error }
 *
 * Alur:
 * 1. Validasi input Zod
 * 2. Cek sesi login
 * 3. Verifikasi role: hanya pembimbing/admin yang boleh menilai
 * 4. Update grade, feedback, graded_by, graded_at
 * 5. Revalidate halaman pembimbing
 */
export async function gradeLogbookEntry(input: z.infer<typeof gradeSchema>) {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { error: "Data tidak valid." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  // --- Verifikasi role ---
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "pembimbing" && profile?.role !== "admin") {
    return { error: "Kamu tidak punya izin untuk menilai logbook ini." };
  }

  // --- Update nilai ---
  const { error } = await supabase
    .from("logbook_entries")
    .update({
      grade: parsed.data.grade,
      feedback: parsed.data.feedback ?? null,
      graded_by: user.id,
      graded_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);

  if (error) return { error: "Gagal menyimpan nilai: " + error.message };

  revalidatePath("/dashboard/pembimbing/kegiatan-harian");
  return { success: true };
}
