"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createSchema = z
  .object({
    type: z.enum(["izin", "sakit", "cuti"]),
    reason: z.string().min(10, "Alasan minimal 10 karakter."),
    start_date: z.string(),
    end_date: z.string(),
    proof_path: z.string().nullable(),
    proof_url: z.string().nullable(),
  })
  .refine((v) => v.end_date >= v.start_date, {
    message: "Tanggal selesai tidak boleh sebelum tanggal mulai.",
    path: ["end_date"],
  });

export async function createLeaveRequest(input: z.infer<typeof createSchema>) {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Data tidak valid." };
  }

  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  const result = await Repositories.leave().createLeave({
    studentId: user.id,
    type: parsed.data.type,
    reason: parsed.data.reason,
    proofUrl: parsed.data.proof_url ?? undefined,
    startDate: parsed.data.start_date,
    endDate: parsed.data.end_date,
  });

  if (result.error) return { error: result.error };

  revalidatePath("/dashboard/siswa/izin");
  return { success: true };
}

const reviewSchema = z.object({
  id: z.string().uuid(),
  decision: z.enum(["disetujui", "ditolak"]),
  review_note: z.string().optional(),
});

export async function reviewLeaveRequest(input: z.infer<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { error: "Data tidak valid." };

  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  if (user.role !== "pembimbing" && user.role !== "admin") {
    return { error: "Kamu tidak punya izin untuk memproses pengajuan ini." };
  }

  const result = await Repositories.leave().reviewLeave(
    parsed.data.id,
    parsed.data.decision,
    user.id,
    parsed.data.review_note
  );

  if (result.error) return { error: result.error };

  revalidatePath("/dashboard/pembimbing/izin");
  revalidatePath("/dashboard/admin/izin");
  return { success: true };
}
