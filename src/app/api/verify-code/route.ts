import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();
    if (!email?.trim() || !code?.trim()) {
      return NextResponse.json({ error: "Email dan kode wajib diisi." }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data } = await supabase
      .from("verification_codes")
      .select("id, code, expires_at, used")
      .eq("email", email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!data) {
      return NextResponse.json({ error: "Kode tidak ditemukan. Kirim ulang kode." }, { status: 400 });
    }

    if (data.used) {
      return NextResponse.json({ error: "Kode sudah digunakan." }, { status: 400 });
    }

    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ error: "Kode sudah kadaluarsa. Kirim ulang." }, { status: 400 });
    }

    if (data.code !== code) {
      return NextResponse.json({ error: "Kode salah." }, { status: 400 });
    }

    // Tandai kode sebagai used
    await supabase.from("verification_codes").update({ used: true }).eq("id", data.id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal verifikasi." }, { status: 500 });
  }
}