"use server";

import { Repositories } from "@/lib/repositories";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createNotifications } from "./notifications";

const createSchema = z
  .object({
    type: z.enum(["izin", "sakit", "cuti"]),
    reason: z.string().min(50, "Alasan minimal 50 karakter."),
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

  // Notifikasi ke pembimbing siswa bahwa ada pengajuan izin baru
  const adminSupabase = createAdminClient();
  const { data: sm } = await adminSupabase
    .from("student_mentors")
    .select("mentor_id")
    .eq("student_id", user.id)
    .maybeSingle();
  if (sm?.mentor_id) {
    await createNotifications([
      {
        user_id: sm.mentor_id,
        title: "Pengajuan izin baru",
        message: `Pengajuan ${parsed.data.type.toUpperCase()} menunggu persetujuan Anda.`,
        link: "/dashboard/pembimbing/izin",
      },
    ]);
  }

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

  // Notifikasi hasil persetujuan ke siswa
  const adminSupabase = createAdminClient();
  const { data: lr } = await adminSupabase
    .from("leave_requests")
    .select("student_id")
    .eq("id", parsed.data.id)
    .single();
  if (lr?.student_id) {
    await createNotifications([
      {
        user_id: lr.student_id,
        title: `Pengajuan izin ${parsed.data.decision === "disetujui" ? "disetujui" : "ditolak"}`,
        message:
          parsed.data.decision === "disetujui"
            ? "Pengajuan izin Anda telah disetujui oleh pembimbing."
            : "Pengajuan izin Anda ditolak oleh pembimbing.",
        link: "/dashboard/siswa/izin",
      },
    ]);
  }

  revalidatePath("/dashboard/pembimbing/izin");
  revalidatePath("/dashboard/admin/izin");
  return { success: true };
}
