// ============================================================
// PgAnnouncementRepository — Implementasi IAnnouncementRepository
// ============================================================
// Menangani broadcast pengumuman dari admin ke siswa
// dengan raw PostgreSQL queries.
// ============================================================

import { query, transaction } from "@/lib/postgres";
import type { Announcement, CreateAnnouncementInput } from "../types";
import type { IAnnouncementRepository } from "../interfaces/IAnnouncementRepository";

export class PgAnnouncementRepository implements IAnnouncementRepository {
  /**
   * getAll — Ambil semua pengumuman beserta recipients
   */
  async getAll(): Promise<Announcement[]> {
    try {
      const result = await query(
        `SELECT a.id, a.title, a.content, a.created_by, a.created_at,
                a.broadcast_to_all,
                COALESCE(
                  (SELECT array_agg(ar.study_program_id)
                   FROM announcement_recipients ar
                   WHERE ar.announcement_id = a.id),
                  '{}'::text[]
                ) AS recipients
         FROM announcements a
         ORDER BY a.created_at DESC`
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        createdBy: row.created_by,
        createdAt: row.created_at,
        broadcastToAll: row.broadcast_to_all,
        recipients: row.recipients || [],
      }));
    } catch {
      return [];
    }
  }

  /**
   * getForStudent — Ambil pengumuman yang relevan untuk siswa
   */
  async getForStudent(
    studentId: string,
    jurusanId: string
  ): Promise<Announcement[]> {
    try {
      const twoDaysAgo = new Date();
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      twoDaysAgo.setHours(0, 0, 0, 0);
      const cutoff = twoDaysAgo.toISOString();

      const result = await query(
        `SELECT a.id, a.title, a.content, a.created_by, a.created_at,
                a.broadcast_to_all,
                COALESCE(
                  (SELECT array_agg(ar.study_program_id)
                   FROM announcement_recipients ar
                   WHERE ar.announcement_id = a.id),
                  '{}'::text[]
                ) AS recipients
         FROM announcements a
         WHERE a.created_at >= $1
           AND (
             a.broadcast_to_all = true
             OR $2 = ANY(
               SELECT ar2.study_program_id
               FROM announcement_recipients ar2
               WHERE ar2.announcement_id = a.id
             )
           )
         ORDER BY a.created_at DESC`,
        [cutoff, jurusanId]
      );

      return result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        content: row.content,
        createdBy: row.created_by,
        createdAt: row.created_at,
        broadcastToAll: row.broadcast_to_all,
        recipients: row.recipients || [],
      }));
    } catch {
      return [];
    }
  }

  /**
   * create — Buat pengumuman baru
   */
  async create(
    input: CreateAnnouncementInput
  ): Promise<{ id?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO announcements (id, title, content, created_by, broadcast_to_all)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)
         RETURNING id`,
        [input.title, input.content, input.createdBy, input.broadcastToAll]
      );

      const announcementId = result.rows[0].id;

      // Insert recipients jika tidak broadcast ke semua
      if (!input.broadcastToAll && input.studyProgramIds.length > 0) {
        const values = input.studyProgramIds
          .map((spId, i) => `($1, $${i + 2})`)
          .join(", ");

        const params: any[] = [announcementId, ...input.studyProgramIds];

        await query(
          `INSERT INTO announcement_recipients (announcement_id, study_program_id)
           VALUES ${values}`,
          params
        );
      }

      return { id: announcementId };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * delete — Hapus pengumuman
   */
  async delete(id: string): Promise<{ error?: string }> {
    try {
      // Hapus recipients terlebih dahulu
      await query(
        `DELETE FROM announcement_recipients WHERE announcement_id = $1`,
        [id]
      );
      await query(`DELETE FROM announcements WHERE id = $1`, [id]);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }
}
