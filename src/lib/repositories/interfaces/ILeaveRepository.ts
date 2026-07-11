// ============================================================
// ILeaveRepository — Interface Repository untuk Izin / Cuti
// ============================================================
// Menangani pengajuan izin, sakit, dan cuti oleh siswa, serta
// proses review oleh pembimbing atau admin.
//
// Alur:
// 1. Siswa mengajukan izin (createLeave)
// 2. Pembimbing/Admin mereview (reviewLeave)
// 3. Status berubah: pending → disetujui / ditolak
// ============================================================

import type {
  LeaveRequest,
  LeaveStatus,
  LeaveType,
  CreateLeaveInput,
} from "../types";

export interface ILeaveRepository {
  /**
   * createLeave — Ajukan izin baru
   * @param input — Data pengajuan (CreateLeaveInput)
   * @returns ID pengajuan atau error
   */
  createLeave(input: CreateLeaveInput): Promise<{ id?: string; error?: string }>;

  /**
   * reviewLeave — Review pengajuan izin (setujui / tolak)
   * @param id — UUID pengajuan
   * @param status — Status baru (disetujui / ditolak)
   * @param reviewedBy — UUID reviewer (pembimbing/admin)
   * @param notes — Catatan review (opsional)
   */
  reviewLeave(
    id: string,
    status: LeaveStatus,
    reviewedBy: string,
    notes?: string
  ): Promise<{ error?: string }>;

  /**
   * getLeavesByStudent — Ambil semua pengajuan milik siswa
   * @param studentId — UUID siswa
   * @returns Array pengajuan
   */
  getLeavesByStudent(studentId: string): Promise<LeaveRequest[]>;

  /**
   * getPendingLeaves — Ambil semua pengajuan yang pending
   * @returns Array pengajuan pending
   */
  getPendingLeaves(): Promise<LeaveRequest[]>;

  /**
   * getLeavesByMentor — Ambil pengajuan dari siswa bimbingan
   * @param mentorId — UUID pembimbing
   * @returns Array pengajuan siswa bimbingan
   */
  getLeavesByMentor(mentorId: string): Promise<LeaveRequest[]>;

  /**
   * getAllLeaves — Ambil semua pengajuan (admin) dengan filter opsional
   * @param filters — Filter status dan/atau tipe izin
   * @returns Array semua pengajuan
   */
  getAllLeaves(
    filters?: { status?: LeaveStatus; type?: LeaveType }
  ): Promise<LeaveRequest[]>;
}
