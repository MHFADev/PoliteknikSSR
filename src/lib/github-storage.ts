import sharp from "sharp";

const GITHUB_API = "https://api.github.com";
const GITHUB_RAW = "https://raw.githubusercontent.com";
const MAX_SIZE_BYTES = 20 * 1024 * 1024; // 20MB

function getConfig() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const owner = process.env.GITHUB_OWNER;
  if (!token || !repo || !owner) {
    throw new Error("GITHUB_TOKEN, GITHUB_REPO, dan GITHUB_OWNER wajib diisi di .env.local");
  }
  return { token, repo, owner };
}

export function getRawUrl(owner: string, repo: string, branch: string, path: string): string {
  return `${GITHUB_RAW}/${owner}/${repo}/${branch}/${path}`;
}

async function compressBuffer(buf: Buffer, mimetype: string): Promise<Buffer> {
  if (mimetype.startsWith("image/")) {
    try {
      const compressed = await sharp(buf)
        .jpeg({ quality: 70 })
        .toBuffer();
      return compressed;
    } catch {
      return buf;
    }
  }
  return buf;
}

export async function uploadToGitHub(
  fileBuffer: Buffer,
  fileName: string,
  bucket: string,
  userId: string
): Promise<{ url: string; error?: string }> {
  if (fileBuffer.length > MAX_SIZE_BYTES) {
    return { url: "", error: `Ukuran file maksimal 20MB. File ini ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB.` };
  }

  const { token, repo, owner } = getConfig();
  const branch = "main";
  const timestamp = Date.now();
  const safeName = fileName.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
  const path = `uploads/${bucket}/${userId}/${timestamp}-${safeName}`;
  const content = fileBuffer.toString("base64");

  const { error: commitError, sha } = await getFileSha(owner, repo, path, branch, token);
  const body: Record<string, any> = {
    message: `upload: ${path}`,
    content,
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { url: "", error: `Gagal upload ke GitHub: ${res.status} - ${errText}` };
  }

  const rawUrl = getRawUrl(owner, repo, branch, path);
  return { url: rawUrl };
}

async function getFileSha(
  owner: string,
  repo: string,
  path: string,
  branch: string,
  token: string
): Promise<{ sha?: string; error?: string }> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return {};
  if (!res.ok) return { error: `Gagal cek file: ${res.status}` };
  const data = await res.json();
  return { sha: data.sha };
}

export async function deleteFromGitHub(path: string): Promise<{ error?: string }> {
  const { token, repo, owner } = getConfig();
  const branch = "main";

  const { sha, error: shaError } = await getFileSha(owner, repo, path, branch, token);
  if (shaError) return { error: shaError };
  if (!sha) return {};

  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({ message: `delete: ${path}`, sha, branch }),
  });

  if (!res.ok) {
    const errText = await res.text();
    return { error: `Gagal hapus dari GitHub: ${res.status} - ${errText}` };
  }

  return {};
}

async function fileExists(path: string): Promise<boolean> {
  const { token, repo, owner } = getConfig();
  const branch = "main";
  const { sha } = await getFileSha(owner, repo, path, branch, token);
  return !!sha;
}

export async function listFiles(folder: string): Promise<string[]> {
  const { token, repo, owner } = getConfig();
  const branch = "main";
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contents/${folder}?ref=${branch}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" },
  });
  if (res.status === 404) return [];
  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.filter((f: any) => f.type === "file").map((f: any) => f.name);
}

export async function downloadFromGitHub(path: string): Promise<Buffer | null> {
  const { token, repo, owner } = getConfig();
  const branch = "main";
  const url = `${GITHUB_RAW}/${owner}/${repo}/${branch}/${path}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export { compressBuffer, MAX_SIZE_BYTES, fileExists };