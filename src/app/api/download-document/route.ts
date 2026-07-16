import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MIME_MAP: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".png": "image/png", ".gif": "image/gif",
  ".webp": "image/webp", ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");
  const filename = searchParams.get("filename") || "dokumen";
  const mode = searchParams.get("mode") || "download";

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
    }

    const blob = await res.blob();
    const ext = "." + filename.split(".").pop()?.toLowerCase();
    const contentType = MIME_MAP[ext] || res.headers.get("content-type") || "application/octet-stream";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": blob.size.toString(),
      "Access-Control-Allow-Origin": "*",
      "X-Content-Type-Options": "nosniff",
    };

    if (mode === "preview") {
      headers["Content-Disposition"] = `inline`;
      headers["Cache-Control"] = "public, max-age=3600";
    } else {
      headers["Content-Disposition"] = `attachment; filename="${filename}"`;
      headers["Cache-Control"] = "no-cache";
    }

    return new NextResponse(blob, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 });
  }
}
