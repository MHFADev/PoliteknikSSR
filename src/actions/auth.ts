"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function signInWithGoogle(role?: string) {
  const supabase = createClient()
  const host = (await headers()).get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`
  const redirectTo = role ? `${origin}/api/auth/callback?role=${role}` : `${origin}/api/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error) return { error: error.message }
  return { url: data.url }
}