import { NextRequest, NextResponse } from "next/server";
import { uploadToGitHub } from "@/lib/github-storage";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = formData.get("bucket") as string | null;
    const userId = formData.get("userId") as string | null;

    if (!file || !bucket || !userId) {
      return NextResponse.json({ error: "Parameter file, bucket, dan userId wajib diisi" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const result = await uploadToGitHub(Buffer.from(arrayBuffer), file.name, bucket, userId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ url: result.url });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal upload" }, { status: 500 });
  }
}