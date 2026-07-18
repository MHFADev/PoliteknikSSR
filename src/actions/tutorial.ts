"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { Repositories } from "@/lib/repositories"

export async function checkTutorialNeeded(): Promise<boolean> {
  const user = await Repositories.users().getCurrentUser()
  if (!user) return false
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) return false
  const settings = authUser.user_metadata?.settings || {}
  return !settings.tutorialCompleted
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
