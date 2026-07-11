/*
 * leave.ts — Manajemen Pengajuan Izin/Cuti Siswa
 * ==========================================
 * Server actions untuk pengajuan izin (siswa) dan review izin
 * (pembimbing/admin) dengan validasi data via Zod.
 *
 * Alur:
 * - Siswa membuat pengajuan via createLeaveRequest
 * - Pembimbing/Admin me-review via reviewLeaveRequest
 * - Validasi dilakukan di server dengan Zod schema
 *
 * Keputusan teknis:
 * - Guard "status = pending" pada update mencegah race-condition double approve
 * - RLS policy (is_mentor_of) memberikan proteksi tambahan untuk pembimbing
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

/**
 * Schema validasi untuk pengajuan izin baru
 * - end_date tidak boleh sebelum start_date (via .refine)
 * - reason minimal 10 karakter
 */
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

/**
 * createLeaveRequest — Buat pengajuan izin baru (siswa)
 * @param input - Data pengajuan (type, reason, dates, proof)
 * @returns Object { success } atau { error }
 *
 * Alur:
 * 1. Validasi input dengan Zod schema
 * 2. Cek sesi login
 * 3. Insert ke leave_requests
 * 4. Revalidate halaman izin siswa
 */
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

/**
 * reviewLeaveRequest — Review pengajuan izin (pembimbing/admin)
 * @param input - ID pengajuan, keputusan, dan catatan review
 * @returns Object { success } atau { error }
 *
 * Alur:
 * 1. Validasi input Zod
 * 2. Cek sesi login
 * 3. Cek role: hanya pembimbing/admin yang bisa review
 * 4. Update status leave_request (hanya jika masih "pending")
 * 5. Revalidate halaman izin pembimbing & admin
 */
export async function reviewLeaveRequest(input: z.infer<typeof reviewSchema>) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { error: "Data tidak valid." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  // --- Verifikasi role: hanya pembimbing/admin yang boleh review ---
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "pembimbing" && profile?.role !== "admin") {
    return { error: "Kamu tidak punya izin untuk memproses pengajuan ini." };
  }

  // --- Update status, dengan guard "status = pending" untuk cegah double-approve ---
  // RLS (public.is_mentor_of) juga akan menolak jika pembimbing bukan mentor siswa terkait
  const { error } = await supabase
    .from("leave_requests")
    .update({
      status: parsed.data.decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_note: parsed.data.review_note ?? null,
    })
    .eq("id", parsed.data.id)
    .eq("status", "pending");

  if (error) return { error: "Gagal memproses: " + error.message };

  revalidatePath("/dashboard/pembimbing/izin");
  revalidatePath("/dashboard/admin/izin");
  return { success: true };
}
