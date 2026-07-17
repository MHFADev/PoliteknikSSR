import type { IStorageProvider, StorageFile } from "../interfaces/IStorageProvider";
import { uploadToGitHub, deleteFromGitHub, listFiles, downloadFromGitHub, getRawUrl, compressBuffer, MAX_SIZE_BYTES } from "@/lib/github-storage";
import crypto from "crypto";

function getOwner(): string {
  return process.env.GITHUB_OWNER || "";
}

function getRepo(): string {
  return process.env.GITHUB_REPO || "";
}

export class GitHubStorageProvider implements IStorageProvider {
  async upload(
    bucket: string,
    path: string,
    file: File | Buffer,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ url: string; error?: string }> {
    try {
      let buffer: Buffer;
      let fileName: string;
      let mimetype: string;

      if (Buffer.isBuffer(file)) {
        buffer = file;
        fileName = path.split("/").pop() || "file";
        mimetype = options?.contentType || "application/octet-stream";
      } else {
        const arrayBuffer = await (file as File).arrayBuffer();
        buffer = Buffer.from(arrayBuffer);
        fileName = (file as File).name;
        mimetype = (file as File).type || options?.contentType || "application/octet-stream";
      }

      if (buffer.length > MAX_SIZE_BYTES) {
        return {
          url: "",
          error: `Ukuran file maksimal 20MB. File ini ${(buffer.length / 1024 / 1024).toFixed(1)}MB.`,
        };
      }

      const compressed = await compressBuffer(buffer, mimetype);
      const userId = path.split("/")[0];
      const safeName = fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
      const timestamp = Date.now();
      const random = crypto.randomBytes(4).toString("hex");
      const ghPath = `uploads/${bucket}/${userId}/${timestamp}-${random}-${safeName}`;

      const result = await uploadToGitHub(compressed, fileName, bucket, userId);
      if (result.error) return { url: "", error: result.error };

      const owner = getOwner();
      const repo = getRepo();
      const branch = "main";
      const url = `${owner && repo ? `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${ghPath}` : result.url}`;

      return { url };
    } catch (err: any) {
      return { url: "", error: "Gagal upload file: " + err.message };
    }
  }

  getPublicUrl(bucket: string, path: string): string {
    const owner = getOwner();
    const repo = getRepo();
    return `https://raw.githubusercontent.com/${owner}/${repo}/main/uploads/${bucket}/${path}`;
  }

  async getSignedUrl(bucket: string, path: string, _expiresIn?: number): Promise<{ url: string; error?: string }> {
    return { url: this.getPublicUrl(bucket, path) };
  }

  async delete(bucket: string, paths: string[]): Promise<{ error?: string }> {
    try {
      for (const p of paths) {
        const ghPath = `uploads/${bucket}/${p}`;
        const { error } = await deleteFromGitHub(ghPath);
        if (error) return { error };
      }
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  async list(bucket: string, folder?: string): Promise<{ files: StorageFile[]; error?: string }> {
    try {
      const ghFolder = folder ? `uploads/${bucket}/${folder}` : `uploads/${bucket}`;
      const names = await listFiles(ghFolder);
      const files: StorageFile[] = names.map((name) => ({
        name,
        size: 0,
      }));
      return { files };
    } catch (err: any) {
      return { files: [], error: err.message };
    }
  }

  async download(bucket: string, path: string): Promise<{ data: Buffer | null; error?: string }> {
    try {
      const ghPath = `uploads/${bucket}/${path}`;
      const data = await downloadFromGitHub(ghPath);
      if (!data) return { data: null, error: "File tidak ditemukan" };
      return { data };
    } catch (err: any) {
      return { data: null, error: err.message };
    }
  }
}