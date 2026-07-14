// ============================================================
// PgAuthProvider — Implementasi IAuthProvider untuk PostgreSQL
// ============================================================
// Sistem autentikasi sederhana berbasis JWT dengan session table.
// Password di-hash menggunakan bcryptjs.
// ============================================================

import { query, transaction } from "@/lib/postgres";
import type { IAuthProvider, AuthUser } from "../interfaces/IAuthProvider";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

export class PgAuthProvider implements IAuthProvider {
  /**
   * signIn — Login dengan email & password
   */
  async signIn(
    email: string,
    password: string
  ): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      const result = await query(
        `SELECT id, email, password_hash, role, full_name, approved
         FROM profiles
         WHERE email = $1
         LIMIT 1`,
        [email]
      );

      if (result.rows.length === 0) {
        return { user: null, error: "Email atau kata sandi salah." };
      }

      const row = result.rows[0];

      if (row.approved === false) {
        return {
          user: null,
          error: "Akun Anda belum disetujui oleh admin. Silakan tunggu persetujuan.",
        };
      }

      const valid = await bcrypt.compare(password, row.password_hash);
      if (!valid) {
        return { user: null, error: "Email atau kata sandi salah." };
      }

      // Buat session baru
      const sessionToken = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await query(
        `INSERT INTO user_sessions (id, user_id, token, expires_at)
         VALUES ($1, $2, $3, $4)`,
        [crypto.randomUUID(), row.id, sessionToken, expiresAt]
      );

      return {
        user: {
          id: row.id,
          email: row.email,
          role: row.role,
          user_metadata: {
            full_name: row.full_name,
            approved: row.approved,
          },
        },
      };
    } catch (err: any) {
      return { user: null, error: "Gagal login: " + err.message };
    }
  }

  /**
   * signUp — Buat akun baru
   */
  async signUp(input: {
    email: string;
    password: string;
    metadata?: Record<string, any>;
  }): Promise<{ userId?: string; error?: string }> {
    try {
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
      const userId = crypto.randomUUID();

      await query(
        `INSERT INTO profiles (id, email, password_hash, full_name, role, kelas, approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          userId,
          input.email,
          passwordHash,
          input.metadata?.full_name || "",
          input.metadata?.role || "siswa",
          input.metadata?.kelas || null,
          false,
        ]
      );

      return { userId };
    } catch (err: any) {
      if (err.code === "23505") {
        return { error: "Email sudah terdaftar." };
      }
      return { error: "Gagal membuat akun: " + err.message };
    }
  }

  /**
   * signOut — Hapus session
   */
  async signOut(): Promise<void> {
    // Session cleanup handled by cookie expiry on client side
  }

  /**
   * getCurrentUser — Ambil user dari session token
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    // Di PostgreSQL implementation, current user harus di-pass dari request context
    // Karena tidak ada built-in session cookie seperti Supabase
    // Method ini mengembalikan null; gunakan getUserById dari repository
    return null;
  }

  /**
   * getUserById — Ambil user berdasarkan ID
   */
  async getUserById(userId: string): Promise<AuthUser | null> {
    try {
      const result = await query(
        `SELECT id, email, role, full_name, approved
         FROM profiles
         WHERE id = $1
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        id: row.id,
        email: row.email,
        role: row.role,
        user_metadata: {
          full_name: row.full_name,
          approved: row.approved,
        },
      };
    } catch {
      return null;
    }
  }

  /**
   * updateUser — Update user metadata
   */
  async updateUser(
    userId: string,
    data: { metadata?: Record<string, any>; password?: string }
  ): Promise<{ error?: string }> {
    try {
      if (data.password) {
        const hash = await bcrypt.hash(data.password, SALT_ROUNDS);
        await query(`UPDATE profiles SET password_hash = $1 WHERE id = $2`, [hash, userId]);
      }

      if (data.metadata) {
        const fields: string[] = [];
        const values: any[] = [];
        let idx = 1;

        if (data.metadata.full_name !== undefined) {
          fields.push(`full_name = $${idx++}`);
          values.push(data.metadata.full_name);
        }
        if (data.metadata.role !== undefined) {
          fields.push(`role = $${idx++}`);
          values.push(data.metadata.role);
        }
        if (data.metadata.approved !== undefined) {
          fields.push(`approved = $${idx++}`);
          values.push(data.metadata.approved);
        }
        if (data.metadata.kelas !== undefined) {
          fields.push(`kelas = $${idx++}`);
          values.push(data.metadata.kelas);
        }

        if (fields.length > 0) {
          values.push(userId);
          await query(`UPDATE profiles SET ${fields.join(", ")} WHERE id = $${idx}`, values);
        }
      }

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * deleteUser — Hapus user
   */
  async deleteUser(userId: string): Promise<{ error?: string }> {
    try {
      await query(`DELETE FROM user_sessions WHERE user_id = $1`, [userId]);
      await query(`DELETE FROM profiles WHERE id = $1`, [userId]);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * listUsers — List semua user
   */
  async listUsers(): Promise<
    { id: string; email: string; metadata?: Record<string, any>; createdAt: string }[]
  > {
    try {
      const result = await query(
        `SELECT id, email, full_name, role, kelas, approved, created_at
         FROM profiles
         ORDER BY created_at DESC`
      );

      return result.rows.map((r) => ({
        id: r.id,
        email: r.email,
        metadata: {
          full_name: r.full_name,
          role: r.role,
          kelas: r.kelas,
          approved: r.approved,
        },
        createdAt: r.created_at,
      }));
    } catch {
      return [];
    }
  }

  /**
   * getUserMetadata — Ambil metadata user
   */
  async getUserMetadata(userId: string): Promise<Record<string, any> | null> {
    try {
      const result = await query(
        `SELECT full_name, role, kelas, approved
         FROM profiles
         WHERE id = $1
         LIMIT 1`,
        [userId]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        full_name: row.full_name,
        role: row.role,
        kelas: row.kelas,
        approved: row.approved,
      };
    } catch {
      return null;
    }
  }
}
