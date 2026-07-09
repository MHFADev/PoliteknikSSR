"use server";

import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  const { error } = await supabase.from("leave_requests").insert({
    student_id: user.id,
    ...parsed.data,
  });

  if (error) return { error: "Gagal mengirim pengajuan: " + error.message };

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

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "pembimbing" && profile?.role !== "admin") {
    return { error: "Kamu tidak punya izin untuk memproses pengajuan ini." };
  }

  // RLS (public.is_mentor_of) akan otomatis menolak update jika pembimbing
  // bukan pembimbing dari siswa terkait — ini lapisan pertahanan tambahan di server.
  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: parsed.data.decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: parsed.data.review_note ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("status", "pending"); // cegah race-condition double approve

  if (error) return { error: "Gagal memproses: " + error.message };

  revalidatePath("/dashboard/pembimbing/izin");
  revalidatePath("/dashboard/admin/izin");
  return { success: true };
}
