// ============================================================
// SupabaseLogbookRepository — Implementasi ILogbookRepository
// ============================================================
// Menangani catatan kegiatan harian siswa (logbook PKL).
//
// Aturan bisnis:
// - 1 entri per siswa per tanggal (upsert)
// - Hanya pembimbing/admin yang bisa memberi nilai
// - Siswa tidak bisa mengubah entri yang sudah dinilai
//
// Mapping Supabase (snake_case) → Domain (camelCase):
// - student_id → studentId
// - entry_date → entryDate
// - photo_url → photoUrl
// - graded_by → gradedBy
// - created_at → createdAt
// - updated_at → updatedAt
// ============================================================

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { LogbookEntry } from "../types";
import type { ILogbookRepository } from "../interfaces/ILogbookRepository";

/** Mapping baris Supabase ke tipe domain LogbookEntry */
function mapLogbookEntry(row: any): LogbookEntry {
  return {
    id: row.id,
    studentId: row.student_id,
    entryDate: row.entry_date,
    activity: row.content,
    photoUrl: row.photo_url,
    grade: row.grade,
    feedback: row.feedback,
    gradedBy: row.graded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class SupabaseLogbookRepository implements ILogbookRepository {
  /**
   * upsertEntry — Buat atau update entri logbook untuk hari tertentu
   * @param studentId — UUID siswa
   * @param entryDate — Tanggal entri (YYYY-MM-DD)
   * @param activity — Deskripsi kegiatan
   * @param photoUrl — URL foto pendukung (opsional)
   * @returns ID entri atau error
   */
  async upsertEntry(
    studentId: string,
    entryDate: string,
    activity: string,
    photoUrl?: string
  ): Promise<{ id?: string; error?: string }> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("logbook_entries")
      .upsert(
        {
          student_id: studentId,
          entry_date: entryDate,
          content: activity,
          photo_url: photoUrl ?? null,
          updated_at: new Date().toISOString(),
        } as any,
        { onConflict: "student_id,entry_date" }
      )
      .select("id")
      .single();

    if (error) return { error: "Gagal menyimpan logbook: " + error.message };
    return { id: data.id };
  }

  /**
   * gradeEntry — Beri nilai pada entri logbook siswa
   * @param id — UUID entri
   * @param grade — Nilai (0-100)
   * @param feedback — Catatan/feedback (opsional)
   * @param gradedBy — UUID pembimbing yang menilai
   */
  async gradeEntry(
    id: string,
    grade: number,
    feedback?: string,
    gradedBy?: string
  ): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("logbook_entries")
      .update({
        grade,
        feedback: feedback ?? null,
        graded_by: gradedBy ?? null,
        graded_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) return { error: "Gagal menyimpan nilai: " + error.message };
    return {};
  }

  /**
   * getEntriesByStudent — Ambil entri milik siswa (opsional filter tanggal)
   * @param studentId — UUID siswa
   * @param start — Tanggal awal filter (opsional, YYYY-MM-DD)
   * @param end — Tanggal akhir filter (opsional, YYYY-MM-DD)
   * @returns Array entri logbook
   */
  async getEntriesByStudent(
    studentId: string,
    start?: string,
    end?: string
  ): Promise<LogbookEntry[]> {
    const supabase = createClient();

    let query = supabase
      .from("logbook_entries")
      .select("*")
      .eq("student_id", studentId)
      .order("entry_date", { ascending: false });

    if (start) {
      query = query.gte("entry_date", start);
    }
    if (end) {
      query = query.lte("entry_date", end);
    }

    const { data } = await query;
    if (!data) return [];
    return data.map(mapLogbookEntry);
  }

  /**
   * getEntriesByMentor — Ambil entri dari semua siswa bimbingan
   * @param mentorId — UUID pembimbing
   * @returns Array entri siswa bimbingan
   */
  async getEntriesByMentor(mentorId: string): Promise<LogbookEntry[]> {
    const supabase = createClient();

    // --- Ambil daftar student_id yang dibimbing oleh mentor ini ---
    const { data: mentorships } = await supabase
      .from("student_mentors")
      .select("student_id")
      .eq("mentor_id", mentorId);

    if (!mentorships || mentorships.length === 0) return [];

    const studentIds = mentorships.map((m) => m.student_id);

    const { data } = await supabase
      .from("logbook_entries")
      .select("*")
      .in("student_id", studentIds)
      .order("entry_date", { ascending: false });

    if (!data) return [];
    return data.map(mapLogbookEntry);
  }

  /**
   * getPendingGrading — Ambil entri yang belum dinilai (untuk pembimbing)
   * @param mentorId — UUID pembimbing
   * @returns Array entri tanpa nilai
   */
  async getPendingGrading(mentorId: string): Promise<LogbookEntry[]> {
    const supabase = createClient();

    // --- Ambil daftar student_id yang dibimbing oleh mentor ini ---
    const { data: mentorships } = await supabase
      .from("student_mentors")
      .select("student_id")
      .eq("mentor_id", mentorId);

    if (!mentorships || mentorships.length === 0) return [];

    const studentIds = mentorships.map((m) => m.student_id);

    const { data } = await supabase
      .from("logbook_entries")
      .select("*")
      .in("student_id", studentIds)
      .is("grade", null)
      .order("entry_date", { ascending: false });

    if (!data) return [];
    return data.map(mapLogbookEntry);
  }

  /**
   * getAllEntries — Ambil semua entri (admin) dengan filter opsional
   * @param filters — Filter studentId dan/atau status penilaian
   * @returns Array entri logbook
   */
  async getAllEntries(
    filters?: { studentId?: string; graded?: boolean }
  ): Promise<LogbookEntry[]> {
    const supabase = createAdminClient();

    let query = supabase
      .from("logbook_entries")
      .select("*");

    if (filters?.studentId) {
      query = query.eq("student_id", filters.studentId);
    }
    if (filters?.graded === true) {
      query = query.not("grade", "is", null);
    } else if (filters?.graded === false) {
      query = query.is("grade", null);
    }

    const { data } = await query.order("entry_date", { ascending: false });
    if (!data) return [];
    return data.map(mapLogbookEntry);
  }

  /**
   * getUploadUrl — Dapatkan signed URL untuk upload foto logbook
   * Menggunakan createAdminClient() (service_role) agar dapat membuat signed URL
   * tanpa terhalang RLS. Signed URL yang dihasilkan bisa dipakai dari browser
   * tanpa perlu auth token.
   *
   * @param studentId — UUID siswa
   * @param entryDate — Tanggal entri
   * @returns Signed URL untuk upload, atau null jika gagal
   */
  async getUploadUrl(studentId: string, entryDate: string): Promise<string | null> {
    const supabase = createAdminClient();

    const fileExtension = "jpg";
    const fileName = `${studentId}/${entryDate}/proof.${fileExtension}`;

    const { data, error } = await supabase.storage
      .from("logbook_photos")
      .createSignedUploadUrl(fileName, { upsert: true });

    if (error) return null;
    return data.signedUrl;
  }
}
