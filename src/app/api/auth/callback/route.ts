import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const admin = createAdminClient()
        const { data: existing } = await admin.from("profiles").select("id").eq("id", user.id).single()
        if (!existing) {
          const meta = user.user_metadata || {}
          await admin.from("profiles").upsert({
            id: user.id,
            full_name: meta.full_name || meta.name || user.email?.split("@")[0] || "User",
            role: "siswa",
            approved: true,
            created_at: user.created_at,
          }).eq("id", user.id)
        } else {
          await admin.from("profiles").update({ approved: true }).eq("id", user.id)
        }
      }
      return NextResponse.redirect(`${origin}/dashboard/siswa`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Gagal autentikasi Google`)
}