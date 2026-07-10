"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const entrySchema = z.object({
  entry_date: z.string(),
  content: z.string().min(20, "Isi logbook minimal 20 karakter agar bermakna."),
  photoUrl: z.string().optional().nullable(),
});

export async function saveLogbookEntry(input: z.infer<typeof entrySchema>) {
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  // upsert: 1 entri per siswa per tanggal (unique constraint di schema.sql)
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

// Helper function for handling file uploads (to be used in client component with supabase client)
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

export async function gradeLogbookEntry(input: z.infer<typeof gradeSchema>) {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { error: "Data tidak valid." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "pembimbing" && profile?.role !== "admin") {
    return { error: "Kamu tidak punya izin untuk menilai logbook ini." };
  }

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
