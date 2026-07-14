// ============================================================
// SupabaseStorageProvider — Implementasi IStorageProvider dengan Supabase Storage
// ============================================================

import type { IStorageProvider, StorageFile } from "../interfaces/IStorageProvider";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export class SupabaseStorageProvider implements IStorageProvider {
  async upload(
    bucket: string,
    path: string,
    file: File | Buffer,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ url: string; error?: string }> {
    const supabase = createAdminClient();

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        upsert: options?.upsert ?? false,
        contentType: options?.contentType,
      });

    if (error) return { url: "", error: error.message };

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return { url: urlData.publicUrl };
  }

  getPublicUrl(bucket: string, path: string): string {
    const supabase = createClient();
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async getSignedUrl(bucket: string, path: string, expiresIn?: number): Promise<{ url: string; error?: string }> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn || 3600);

    if (error) return { url: "", error: error.message };
    return { url: data.signedUrl };
  }

  async delete(bucket: string, paths: string[]): Promise<{ error?: string }> {
    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths);

    if (error) return { error: error.message };
    return {};
  }

  async list(bucket: string, folder?: string): Promise<{ files: StorageFile[]; error?: string }> {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder);

    if (error) return { files: [], error: error.message };

    const files: StorageFile[] = (data || []).map((f: any) => ({
      name: f.name,
      size: f.size || 0,
      mimetype: f.mimetype || undefined,
      createdAt: f.created_at || undefined,
    }));

    return { files };
  }

  async download(bucket: string, path: string): Promise<{ data: Buffer | null; error?: string }> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path);

    if (error) return { data: null, error: error.message };

    const arrayBuffer = await data.arrayBuffer();
    return { data: Buffer.from(arrayBuffer) };
  }
}
