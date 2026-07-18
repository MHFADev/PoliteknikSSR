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
    console.log("[tutorial] authUser.user_metadata:", JSON.stringify(authUser.user_metadata))
    return !settings.tutorialCompleted
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
