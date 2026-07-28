import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

function dashboardForRole(role: string | undefined): string {
  switch (role) {
    case "admin": case "owner": case "root": return "/dashboard/admin"
    case "pembimbing": return "/dashboard/pembimbing"
    default: return "/dashboard/siswa"
  }
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=Kode autentikasi tidak ditemukan`)
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=Gagal autentikasi Google`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=User tidak ditemukan`)
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, approved")
      .eq("id", user.id)
      .maybeSingle()

    if (profile) {
      if (profile.approved !== true) {
        await admin.from("profiles").update({ approved: true }).eq("id", user.id)
      }
      const redirectPath = dashboardForRole(profile.role)
      return NextResponse.redirect(`${origin}${redirectPath}`)
    }

    const meta = user.user_metadata || {}
    const role = meta.role || "siswa"
    await admin.from("profiles").insert({
      id: user.id,
      full_name: meta.full_name || meta.name || user.email?.split("@")[0] || "User",
      role,
      approved: true,
      avatar_url: meta.avatar_url || meta.picture || null,
      created_at: user.created_at,
    })
    await admin.auth.admin.updateUserById(user.id, { user_metadata: { role, approved: true } })

    const redirectPath = dashboardForRole(role)
    return NextResponse.redirect(`${origin}${redirectPath}`)
  } catch (err) {
    console.error("[auth/callback] error:", err)
    return NextResponse.redirect(`${origin}/login?error=Terjadi kesalahan saat autentikasi`)
  }
}