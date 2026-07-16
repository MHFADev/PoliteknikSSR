import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

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
    const contentType = res.headers.get("content-type") || "application/octet-stream";

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Length": blob.size.toString(),
      "Access-Control-Allow-Origin": "*",
    };

    if (mode === "preview") {
      headers["Content-Disposition"] = `inline; filename="${filename}"`;
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
