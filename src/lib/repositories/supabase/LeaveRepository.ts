// ============================================================
// SupabaseLeaveRepository — Implementasi ILeaveRepository
// ============================================================
// Menangani pengajuan izin, sakit, dan cuti oleh siswa, serta
// proses review oleh pembimbing atau admin.
//
// Alur:
// 1. Siswa mengajukan izin (createLeave)
// 2. Pembimbing/Admin mereview (reviewLeave)
// 3. Status berubah: pending → disetujui / ditolak
//
// Mapping Supabase (snake_case) → Domain (camelCase):
// - student_id → studentId
// - start_date → startDate
// - end_date → endDate
// - proof_url → proofUrl
// - reviewed_by → reviewedBy
// - reviewed_at → reviewedAt
// - review_note → reviewNotes
// - created_at → createdAt
// ============================================================

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  CreateLeaveInput,
} from "../types";
import type { ILeaveRepository } from "../interfaces/ILeaveRepository";

/** Mapping baris Supabase ke tipe domain LeaveRequest */
function mapLeaveRequest(row: any): LeaveRequest {
  return {
    id: row.id,
    studentId: row.student_id,
    type: row.type as LeaveType,
    reason: row.reason,
    proofUrl: row.proof_url,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status as LeaveStatus,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    reviewNotes: row.review_note,
    createdAt: row.created_at,
  };
}

export class SupabaseLeaveRepository implements ILeaveRepository {
  /**
   * createLeave — Ajukan izin baru
   * @param input — Data pengajuan (CreateLeaveInput)
   * @returns ID pengajuan atau error
   */
  async createLeave(input: CreateLeaveInput): Promise<{ id?: string; error?: string }> {
    const supabase = createAdminClient();

    // --- Validasi tanggal: end_date tidak boleh sebelum start_date ---
    if (input.endDate < input.startDate) {
      return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .insert({
        student_id: input.studentId,
        type: input.type,
        reason: input.reason,
        proof_url: input.proofUrl ?? null,
        start_date: input.startDate,
        end_date: input.endDate,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) return { error: "Gagal mengirim pengajuan: " + error.message };
    return { id: data.id };
  }

  /**
   * reviewLeave — Review pengajuan izin (setujui / tolak)
   * @param id — UUID pengajuan
   * @param status — Status baru (disetujui / ditolak)
   * @param reviewedBy — UUID reviewer (pembimbing/admin)
   * @param notes — Catatan review (opsional)
   */
  async reviewLeave(
    id: string,
    status: LeaveStatus,
    reviewedBy: string,
    notes?: string
  ): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    // --- Update status, dengan guard "status = pending" untuk cegah double-approve ---
    const { error } = await supabase
      .from("leave_requests")
      .update({
        status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        review_note: notes ?? null,
      })
      .eq("id", id)
      .eq("status", "pending");

    if (error) return { error: "Gagal memproses: " + error.message };
    return {};
  }

  /**
   * getLeavesByStudent — Ambil semua pengajuan milik siswa
   * @param studentId — UUID siswa
   * @returns Array pengajuan
   */
  async getLeavesByStudent(studentId: string): Promise<LeaveRequest[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (!data) return [];
    return data.map(mapLeaveRequest);
  }

  /**
   * getPendingLeaves — Ambil semua pengajuan yang pending
   * @returns Array pengajuan pending
   */
  async getPendingLeaves(): Promise<LeaveRequest[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!data) return [];
    return data.map(mapLeaveRequest);
  }

  /**
   * getLeavesByMentor — Ambil pengajuan dari siswa bimbingan
   * @param mentorId — UUID pembimbing
   * @returns Array pengajuan siswa bimbingan
   */
  async getLeavesByMentor(mentorId: string): Promise<LeaveRequest[]> {
    const supabase = await createClient();

    // --- Ambil daftar student_id yang dibimbing oleh mentor ini ---
    const { data: mentorships } = await supabase
      .from("student_mentors")
      .select("student_id")
      .eq("mentor_id", mentorId);

    if (!mentorships || mentorships.length === 0) return [];

    const studentIds = mentorships.map((m) => m.student_id);

    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .in("student_id", studentIds)
      .order("created_at", { ascending: false });

    if (!data) return [];
    return data.map(mapLeaveRequest);
  }

  /**
   * getAllLeaves — Ambil semua pengajuan (admin) dengan filter opsional
   * @param filters — Filter status dan/atau tipe izin
   * @returns Array semua pengajuan
   */
  async getAllLeaves(
    filters?: { status?: LeaveStatus; type?: LeaveType }
  ): Promise<LeaveRequest[]> {
    const supabase = createAdminClient();

    let query = supabase
      .from("leave_requests")
      .select("*");

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.type) {
      query = query.eq("type", filters.type);
    }

    const { data } = await query.order("created_at", { ascending: false });

    if (!data) return [];
    return data.map(mapLeaveRequest);
  }
}
