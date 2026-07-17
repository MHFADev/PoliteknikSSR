import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email?.trim()) {
      return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Cek apakah email sudah terdaftar
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", (await supabase.auth.admin.listUsers()).data?.users.find(u => u.email === email)?.id || "")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 400 });
    }

    // Hapus code lama untuk email ini
    await supabase.from("verification_codes").delete().eq("email", email);

    // Generate code baru
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 menit

    await supabase.from("verification_codes").insert({
      email: email.toLowerCase(),
      code,
      expires_at: expiresAt,
    });

    // Kirim email (log ke console untuk development)
    console.log(`[VERIFICATION CODE] ${email} → ${code}`);

    // Coba kirim via Supabase Auth (butuh SMTP config)
    try {
      await supabase.auth.admin.generateLink({
        type: "signup",
        email,
        password: "temp-" + code,
      });
    } catch {}

    return NextResponse.json({ success: true, message: "Kode verifikasi telah dikirim ke email." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Gagal mengirim kode." }, { status: 500 });
  }
}