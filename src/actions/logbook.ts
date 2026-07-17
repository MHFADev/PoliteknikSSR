"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const entrySchema = z.object({
  entry_date: z.string(),
  content: z.string().min(50, "Isi minimal 50 karakter agar bermakna."),
  photoUrl: z.string().optional().nullable(),
});

export async function saveLogbookEntry(input: z.infer<typeof entrySchema>) {
  const parsed = entrySchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };

  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  const result = await Repositories.logbook().upsertEntry(
    user.id,
    parsed.data.entry_date,
    parsed.data.content,
    parsed.data.photoUrl ?? undefined
  );

  if (result.error) return { error: result.error };

  revalidatePath("/dashboard/siswa/kegiatan-harian");
  return { success: true };
}

export async function getUploadSignedUrl(userId: string, entryDate: string): Promise<{ signedUrl: string; path: string } | { error: string }> {
  const signedUrl = await Repositories.logbook().getUploadUrl(userId, entryDate);
  if (!signedUrl) {
    return { error: "Gagal membuat URL upload" };
  }
  const fileName = `${userId}/${entryDate}/proof.jpg`;
  return { signedUrl, path: fileName };
}

const gradeSchema = z.object({
  id: z.string().uuid(),
  grade: z.number().min(0).max(100),
  feedback: z.string().max(1000).optional(),
});

export async function gradeLogbookEntry(input: z.infer<typeof gradeSchema>) {
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return { error: "Data tidak valid." };

  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  if (user.role !== "pembimbing" && user.role !== "admin") {
    return { error: "Kamu tidak punya izin untuk menilai logbook ini." };
  }

  const result = await Repositories.logbook().gradeEntry(
    parsed.data.id,
    parsed.data.grade,
    parsed.data.feedback,
    user.id
  );

  if (result.error) return { error: result.error };

  revalidatePath("/dashboard/pembimbing/kegiatan-harian");
  return { success: true };
}
