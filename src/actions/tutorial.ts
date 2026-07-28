"use server"

import { createClient } from "@/lib/supabase/server"

export async function checkTutorialNeeded(): Promise<boolean> {
  try {
    const supabase = createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      console.warn("[tutorial] No auth user found")
      return false
    }
    const settings = authUser.user_metadata?.settings || {}
    if (settings.tutorialCompleted) return false

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .single()

    if (profile?.role === "siswa") {
      const { data: mentor } = await supabase
        .from("student_mentors")
        .select("mentor_id")
        .eq("student_id", authUser.id)
        .maybeSingle()
      if (!mentor) return false
    }

    return true
  } catch (err) {
    console.error("[tutorial] checkTutorialNeeded error:", err)
    return false
  }
}

export async function completeTutorial(): Promise<void> {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return
  const currentMeta = authUser.user_metadata || {}
  const currentSettings = currentMeta.settings || {}
  await supabase.auth.updateUser({
    data: {
      ...currentMeta,
      settings: { ...currentSettings, tutorialCompleted: true },
    },
  })
}
