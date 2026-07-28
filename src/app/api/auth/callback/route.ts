import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Kode autentikasi tidak ditemukan`)
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.session) {
      return NextResponse.redirect(`${origin}/login?error=Gagal autentikasi Google`)
    }

    const { user } = data
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=User tidak ditemukan`)
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile) {
      const meta = user.user_metadata || {}
      const role = searchParams.get("role") || meta.role || "siswa"
      await admin.from("profiles").insert({
        id: user.id,
        full_name: "Pengguna Baru",
        role,
        approved: true,
        avatar_url: meta.avatar_url || meta.picture || null,
        created_at: user.created_at,
      })
      await admin.auth.admin.updateUserById(user.id, { user_metadata: { role, approved: true } })
    }

    return NextResponse.redirect(`${origin}/`)
  } catch (err) {
    console.error("[auth/callback] error:", err)
    return NextResponse.redirect(`${origin}/login?error=Terjadi kesalahan saat autentikasi`)
  }
}