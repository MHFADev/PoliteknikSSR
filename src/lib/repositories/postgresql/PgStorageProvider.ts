// ============================================================
// PgStorageProvider — Implementasi IStorageProvider untuk PostgreSQL
// ============================================================
// Menyimpan file di local filesystem (public/uploads/).
// Menggunakan Node.js fs module untuk operasi file.
// ============================================================

import type { IStorageProvider, StorageFile } from "../interfaces/IStorageProvider";
import fs from "fs/promises";
import path from "path";

const UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

async function ensureDir(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

export class PgStorageProvider implements IStorageProvider {
  /**
   * upload — Upload file ke local filesystem
   */
  async upload(
    bucket: string,
    p: string,
    file: File | Buffer,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ url: string; error?: string }> {
    try {
      const bucketDir = path.join(UPLOADS_ROOT, bucket);
      const filePath = path.join(bucketDir, p);
      const fileDir = path.dirname(filePath);

      await ensureDir(fileDir);

      // Cek apakah file sudah ada dan upsert tidak diizinkan
      if (!options?.upsert) {
        try {
          await fs.access(filePath);
          return { url: "", error: "File sudah ada. Gunakan upsert untuk menimpa." };
        } catch {
          // File belum ada, lanjutkan
        }
      }

      let buffer: Buffer;
      if (Buffer.isBuffer(file)) {
        buffer = file;
      } else {
        // File object — konversi ke buffer
        const arrayBuffer = await (file as File).arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
      }

      await fs.writeFile(filePath, buffer);

      const url = `/uploads/${bucket}/${p}`;
      return { url };
    } catch (err: any) {
      return { url: "", error: "Gagal upload file: " + err.message };
    }
  }

  /**
   * getPublicUrl — Dapatkan public URL untuk file
   */
  getPublicUrl(bucket: string, p: string): string {
    return `/uploads/${bucket}/${p}`;
  }

  /**
   * getSignedUrl — Untuk local storage, return public URL (tidak ada expiry)
   */
  async getSignedUrl(
    bucket: string,
    p: string,
    _expiresIn?: number
  ): Promise<{ url: string; error?: string }> {
    return { url: this.getPublicUrl(bucket, p) };
  }

  /**
   * delete — Hapus file dari local filesystem
   */
  async delete(bucket: string, paths: string[]): Promise<{ error?: string }> {
    try {
      for (const p of paths) {
        const filePath = path.join(UPLOADS_ROOT, bucket, p);
        try {
          await fs.unlink(filePath);
        } catch {
          // File tidak ditemukan, skip
        }
      }
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * list — List file dalam folder
   */
  async list(
    bucket: string,
    folder?: string
  ): Promise<{ files: StorageFile[]; error?: string }> {
    try {
      const dirPath = folder
        ? path.join(UPLOADS_ROOT, bucket, folder)
        : path.join(UPLOADS_ROOT, bucket);

      await ensureDir(dirPath);

      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      const files: StorageFile[] = [];

      for (const entry of entries) {
        if (entry.isFile()) {
          const filePath = path.join(dirPath, entry.name);
          const stat = await fs.stat(filePath);
          files.push({
            name: entry.name,
            size: stat.size,
            createdAt: stat.birthtime.toISOString(),
          });
        }
      }

      return { files };
    } catch (err: any) {
      return { files: [], error: err.message };
    }
  }

  /**
   * download — Download file sebagai Buffer
   */
  async download(
    bucket: string,
    p: string
  ): Promise<{ data: Buffer | null; error?: string }> {
    try {
      const filePath = path.join(UPLOADS_ROOT, bucket, p);
      const data = await fs.readFile(filePath);
      return { data };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }
}
