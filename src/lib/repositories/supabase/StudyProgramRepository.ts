// ============================================================
// SupabaseStudyProgramRepository — Implementasi IStudyProgramRepository
// ============================================================
// Menangani data program studi / jurusan dan relasi
// antara siswa dengan pembimbing (student_mentors).
//
// Mapping Supabase (snake_case) → Domain (camelCase):
// - student_id → studentId
// - mentor_id → mentorId
// ============================================================

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { StudyProgram, StudentMentor } from "../types";
import type { IStudyProgramRepository } from "../interfaces/IStudyProgramRepository";

/** Mapping baris Supabase ke tipe domain StudyProgram */
function mapStudyProgram(row: any): StudyProgram {
  return {
    id: row.id,
    nama: row.nama,
    kode: row.kode,
  };
}

/** Mapping baris Supabase ke tipe domain StudentMentor */
function mapStudentMentor(row: any): StudentMentor {
  return {
    studentId: row.student_id,
    mentorId: row.mentor_id,
  };
}

export class SupabaseStudyProgramRepository implements IStudyProgramRepository {
  /**
   * getAll — Ambil semua program studi
   * @returns Array program studi
   */
  async getAll(): Promise<StudyProgram[]> {
    const supabase = createClient();

    const { data } = await supabase
      .from("study_programs")
      .select("*")
      .order("nama", { ascending: true });

    if (!data) return [];
    return data.map(mapStudyProgram);
  }

  /**
   * ensure — Pastikan program studi ada (buat jika belum)
   *
   * Alur:
   * 1. Cek apakah program studi sudah ada (case-insensitive)
   * 2. Jika sudah ada, kembalikan ID-nya
   * 3. Jika belum, buat baru dengan kode otomatis dari nama
   *
   * @param nama — Nama program studi (contoh: "D4 Animation")
   * @returns ID program studi atau error
   */
  async ensure(nama: string): Promise<{ id?: string; error?: string }> {
    const supabase = createAdminClient();
    const trimmed = nama.trim();
    if (!trimmed) return { error: "Nama program studi tidak boleh kosong." };

    // --- Cari program studi yang sudah ada (case-insensitive) ---
    const { data: existing } = await supabase
      .from("study_programs")
      .select("id")
      .ilike("nama", trimmed)
      .maybeSingle();

    if (existing) return { id: existing.id };

    // --- Generate kode otomatis dari nama (uppercase, tanpa karakter spesial) ---
    const kode = trimmed
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 10);

    // --- Buat program studi baru ---
    const { data, error } = await supabase
      .from("study_programs")
      .insert({ nama: trimmed, kode })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { id: data.id };
  }

  /**
   * getStudentMentors — Ambil semua relasi siswa-pembimbing
   * @returns Array relasi (studentId, mentorId)
   */
  async getStudentMentors(): Promise<StudentMentor[]> {
    const supabase = createClient();

    const { data } = await supabase
      .from("student_mentors")
      .select("*");

    if (!data) return [];
    return data.map(mapStudentMentor);
  }

  /**
   * setStudentMentor — Tetapkan pembimbing untuk siswa
   * @param studentId — UUID siswa
   * @param mentorId — UUID pembimbing
   */
  async setStudentMentor(
    studentId: string,
    mentorId: string
  ): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    // --- Upsert: jika sudah ada relasi, akan diupdate ---
    const { error } = await supabase
      .from("student_mentors")
      .upsert(
        {
          student_id: studentId,
          mentor_id: mentorId,
        },
        { onConflict: "student_id" }
      );

    if (error) return { error: error.message };
    return {};
  }
}
