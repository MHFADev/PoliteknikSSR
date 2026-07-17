// ============================================================
// SupabaseAnnouncementRepository — Implementasi IAnnouncementRepository
// ============================================================
// Menangani broadcast pengumuman dari admin ke siswa.
//
// Dua mode broadcast:
// 1. broadcastToAll = true → semua siswa menerima
// 2. broadcastToAll = false → hanya siswa di studyProgramIds tertentu
//
// Mapping Supabase (snake_case) → Domain (camelCase):
// - broadcast_to_all → broadcastToAll
// - created_by → createdBy
// - created_at → createdAt
// - study_program_id di-perpetuate sebagai string di recipients[]
// ============================================================

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { Announcement, CreateAnnouncementInput } from "../types";
import type { IAnnouncementRepository } from "../interfaces/IAnnouncementRepository";

/** Mapping baris Supabase ke tipe domain Announcement */
function mapAnnouncement(row: any): Announcement {
  const recipients: string[] = [];
  if (row.announcement_recipients && Array.isArray(row.announcement_recipients)) {
    for (const r of row.announcement_recipients) {
      if (r.study_program_id) recipients.push(r.study_program_id);
    }
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdBy: row.created_by,
    createdAt: row.created_at,
    broadcastToAll: row.broadcast_to_all,
    recipients,
  };
}

export class SupabaseAnnouncementRepository implements IAnnouncementRepository {
  /**
   * getAll — Ambil semua pengumuman
   * @returns Array pengumuman
   */
  async getAll(): Promise<Announcement[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from("announcements")
      .select("*, announcement_recipients(study_program_id)")
      .order("created_at", { ascending: false });

    if (!data) return [];
    return data.map(mapAnnouncement);
  }

  /**
   * getForStudent — Ambil pengumuman yang relevan untuk siswa
   *
   * Alur:
   * 1. Ambil semua pengumuman (termasuk recipients)
   * 2. Filter yang dibuat dalam 2 hari terakhir
   * 3. Filter: broadcast_to_all → tampilkan, atau siswa masuk recipient
   *
   * @param studentId — UUID siswa
   * @param jurusanId — UUID program studi siswa
   * @returns Array pengumuman (broadcast + spesifik jurusan)
   */
  async getForStudent(studentId: string, jurusanId: string): Promise<Announcement[]> {
    const supabase = await createClient();

    const { data } = await supabase
      .from("announcements")
      .select("id, title, content, broadcast_to_all, created_at, announcement_recipients(study_program_id)")
      .order("created_at", { ascending: false });

    if (!data) return [];

    // --- Filter pengumuman 2 hari terakhir ---
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);

    const filtered = data.filter((a: any) => {
      const createdAt = new Date(a.created_at);
      if (createdAt < twoDaysAgo) return false;

      if (a.broadcast_to_all) return true;
      if (!jurusanId) return false;
      return a.announcement_recipients?.some(
        (r: any) => r.study_program_id === jurusanId
      );
    });

    return filtered.map(mapAnnouncement);
  }

  /**
   * create — Buat pengumuman baru
   *
   * Alur:
   * 1. Insert pengumuman ke tabel announcements
   * 2. Jika tidak broadcast_to_all, insert recipients per program studi
   *
   * @param input — Data pengumuman (CreateAnnouncementInput)
   *              studyProgramIds diabaikan jika broadcastToAll = true
   * @returns ID pengumuman atau error
   */
  async create(input: CreateAnnouncementInput): Promise<{ id?: string; error?: string }> {
    const supabase = createAdminClient();

    // --- Insert pengumuman ---
    const { data: announcement, error: insertError } = await supabase
      .from("announcements")
      .insert({
        title: input.title,
        content: input.content,
        broadcast_to_all: input.broadcastToAll,
        created_by: input.createdBy,
      })
      .select("id")
      .single();

    if (insertError) return { error: insertError.message };

    // --- Insert recipients jika tidak broadcast ke semua ---
    if (!input.broadcastToAll && input.studyProgramIds.length > 0) {
      const recipients = input.studyProgramIds.map((spId) => ({
        announcement_id: announcement.id,
        study_program_id: spId,
      }));

      const { error: recipientsError } = await supabase
        .from("announcement_recipients")
        .insert(recipients);

      if (recipientsError) return { error: recipientsError.message };
    }

    return { id: announcement.id };
  }

  /**
   * delete — Hapus pengumuman
   * @param id — UUID pengumuman
   */
  async delete(id: string): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    const { error } = await supabase.from("announcements").delete().eq("id", id);

    if (error) return { error: error.message };
    return {};
  }
}
