"use server"

import { createClient, createAdminClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function getCurrentProfile() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, identity_number, jurusan_id, instansi, kelas")
    .eq("id", user.id)
    .single()

  return profile
}

export async function completeProfile(data: {
  fullName: string
  role: string
  jurusanId?: string
  identityNumber?: string
  instansi?: string
  kelas?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Sesi tidak ditemukan." }

  const adminSupabase = createAdminClient()

  const { error } = await adminSupabase
    .from("profiles")
    .update({
      full_name: data.fullName,
      role: data.role as any,
      identity_number: data.identityNumber || null,
      jurusan_id: data.jurusanId || null,
      instansi: data.instansi || null,
      kelas: data.kelas || null,
    })
    .eq("id", user.id)

  if (error) return { error: error.message }

  await adminSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      role: data.role,
      full_name: data.fullName,
      profile_completed: true,
    },
  })

  return { success: true }
}

export async function isProfileComplete() {
  const profile = await getCurrentProfile()
  if (!profile) return false
  return !!(
    profile.full_name &&
    profile.full_name !== "Pengguna Baru" &&
    profile.role
  )
}