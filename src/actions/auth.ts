"use server"

import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function signInWithGoogle() {
  const supabase = createClient()
  const origin = (await headers()).get("origin") || "http://localhost:3000"

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