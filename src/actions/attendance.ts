"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

export async function submitAttendance(scannedToken: string) {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { success: false, message: "Sesi login tidak ditemukan. Silakan login ulang." };
  if (user.role !== "siswa") {
    return { success: false, message: "Hanya akun siswa yang dapat melakukan presensi." };
  }

  const result = await Repositories.attendance().verifyAndRecordAttendance(scannedToken, user.id);
  if (result.error) return { success: false, message: result.error };

  const now = new Date();
  const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const name = user.fullName || "Siswa";

  revalidatePath("/dashboard/siswa");
  return {
    success: true,
    status: result.status,
    name,
    time: timeStr,
    message: result.status === "hadir"
      ? `${name}, anda hadir tepat waktu pukul ${timeStr}.`
      : `${name}, anda telat masuk PKL. Absen pukul ${timeStr}.`,
  };
}

export async function saveAttendanceSettings(lateTime: string, qrDuration: number) {
  const supabase = createAdminClient();
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi tidak ditemukan." };

  const { data: existing } = await supabase.auth.admin.getUserById(user.id);
  if (!existing?.user) return { error: "User tidak ditemukan." };

  const meta = { ...existing.user.user_metadata };
  meta.settings = { ...(meta.settings || {}), lateTime, qrExpiryHours: qrDuration };

  const { error } = await supabase.auth.admin.updateUserById(user.id, { user_metadata: meta });
  if (error) return { error: error.message };
  return { success: true };
}

export async function getAttendanceSettings() {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { lateTime: "08:00", qrDuration: 12 };

  const supabase = createAdminClient();
  const { data } = await supabase.auth.admin.getUserById(user.id);
  const settings = data?.user?.user_metadata?.settings;
  return {
    lateTime: settings?.lateTime || "08:00",
    qrDuration: settings?.qrExpiryHours || 12,
  };
}