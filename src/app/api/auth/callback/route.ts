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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error || !data.session) {
      return NextResponse.redirect(`${origin}/login?error=Gagal autentikasi Google`)
    }

    const { user, session } = data
    if (!user) {
      return NextResponse.redirect(`${origin}/login?error=User tidak ditemukan`)
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("id, role, approved")
      .eq("id", user.id)
      .maybeSingle()

    let redirectPath: string

    if (profile) {
      if (profile.approved !== true) {
        await admin.from("profiles").update({ approved: true }).eq("id", user.id)
      }
      redirectPath = dashboardForRole(profile.role)
    } else {
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
      redirectPath = "/complete-profile"
    }

    const response = NextResponse.redirect(`${origin}${redirectPath}`)
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/(.+)\.supabase/)?.[1]
    if (projectRef) {
      response.cookies.set(`sb-${projectRef}-auth-token`, JSON.stringify({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_in: session.expires_in,
        expires_at: session.expires_at,
        token_type: session.token_type,
      }), {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 365,
      })
    }

    return response
  } catch (err) {
    console.error("[auth/callback] error:", err)
    return NextResponse.redirect(`${origin}/login?error=Terjadi kesalahan saat autentikasi`)
  }
}