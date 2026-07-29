"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getMentorSettings(mentorId?: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const id = mentorId || user.id
  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("mentor_settings")
    .select("entry_time, late_time, work_days")
    .eq("mentor_id", id)
    .maybeSingle()

  return {
    entryTime: data?.entry_time || "07:00",
    lateTime: data?.late_time || "08:10",
    workDays: Array.isArray(data?.work_days) ? data.work_days : [1, 2, 3, 4, 5],
  }
}

export async function saveMentorSettings(
  entryTime: string,
  lateTime: string,
  workDays: number[],
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sesi tidak ditemukan." }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "pembimbing") {
    return { error: "Hanya pembimbing yang dapat mengubah pengaturan ini." }
  }

  const adminSupabase = createAdminClient()
  const { error } = await adminSupabase
    .from("mentor_settings")
    .upsert({
      mentor_id: user.id,
      entry_time: entryTime,
      late_time: lateTime,
      work_days: workDays,
      updated_at: new Date().toISOString(),
    })

  if (error) return { error: error.message }
  revalidatePath("/dashboard/pembimbing/settings")
  return { success: true }
}

export async function getStudentEffectiveSettings(studentId: string) {
  const adminSupabase = createAdminClient()

  const { data: mentor } = await adminSupabase
    .from("student_mentors")
    .select("mentor_id")
    .eq("student_id", studentId)
    .maybeSingle()

  if (mentor) {
    const { data: ms } = await adminSupabase
      .from("mentor_settings")
      .select("entry_time, late_time, work_days")
      .eq("mentor_id", mentor.mentor_id)
      .maybeSingle()

    if (ms) {
      return {
        entryTime: ms.entry_time || "07:00",
        lateTime: ms.late_time || "08:10",
        workDays: Array.isArray(ms.work_days) ? ms.work_days : [1, 2, 3, 4, 5],
        mentorId: mentor.mentor_id,
      }
    }
  }

  const { data: appCfg } = await adminSupabase
    .from("app_settings")
    .select("entry_time, late_time")
    .eq("id", 1)
    .maybeSingle()

  return {
    entryTime: appCfg?.entry_time || "07:00",
    lateTime: appCfg?.late_time || "08:10",
    workDays: [1, 2, 3, 4, 5],
    mentorId: mentor?.mentor_id || null,
  }
}

export async function getCurrentPembimbingSettings() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminSupabase = createAdminClient()
  const { data } = await adminSupabase
    .from("mentor_settings")
    .select("entry_time, late_time, work_days")
    .eq("mentor_id", user.id)
    .maybeSingle()

  return {
    entryTime: data?.entry_time || "07:00",
    lateTime: data?.late_time || "08:10",
    workDays: Array.isArray(data?.work_days) ? data.work_days : [1, 2, 3, 4, 5],
  }
}