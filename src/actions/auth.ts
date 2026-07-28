"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function signInWithGoogle() {
  const supabase = createClient()
  const host = (await headers()).get("host") || "localhost:3000"
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https"
  const origin = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/api/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error) return { error: error.message }
  return { url: data.url }
}