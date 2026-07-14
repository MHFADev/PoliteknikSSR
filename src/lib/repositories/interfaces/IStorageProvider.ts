// ============================================================
// IStorageProvider — Interface untuk File Storage
// ============================================================
// Abstraksi untuk upload/download/delete file.
// Bisa diimplementasikan dengan Supabase Storage, local filesystem,
// AWS S3, Cloudflare R2, dll.
// ============================================================

export interface StorageFile {
  name: string;
  size: number;
  mimetype?: string;
  createdAt?: string;
}

export interface IStorageProvider {
  /**
   * upload — Upload file ke storage
   * @param bucket - Nama bucket/container
   * @param path - Path file (termasuk nama file)
   * @param file - File yang akan di-upload
   * @param options - Opsi tambahan (upsert, contentType, dll)
   * @returns Public URL atau signed URL
   */
  upload(
    bucket: string,
    path: string,
    file: File | Buffer,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ url: string; error?: string }>;

  /**
   * getPublicUrl — Dapatkan public URL untuk file
   */
  getPublicUrl(bucket: string, path: string): string;

  /**
   * getSignedUrl — Dapatkan signed URL (berlaku terbatas)
   */
  getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<{ url: string; error?: string }>;

  /**
   * delete — Hapus file dari storage
   */
  delete(bucket: string, paths: string[]): Promise<{ error?: string }>;

  /**
   * list — List file dalam folder
   */
  list(bucket: string, folder?: string): Promise<{ files: StorageFile[]; error?: string }>;

  /**
   * download — Download file sebagai Buffer
   */
  download(bucket: string, path: string): Promise<{ data: Buffer | null; error?: string }>;
}
