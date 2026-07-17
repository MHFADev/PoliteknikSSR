"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function submitAttendance(scannedToken: string, clientTimestamp?: string) {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { success: false, message: "Sesi login tidak ditemukan. Silakan login ulang." };
  if (user.role !== "siswa") {
    return { success: false, message: "Hanya akun siswa yang dapat melakukan presensi." };
  }

  const clientDate = clientTimestamp ? new Date(clientTimestamp) : undefined;
  const result = await Repositories.attendance().verifyAndRecordAttendance(scannedToken, user.id, clientDate);
  if (result.error) return { success: false, message: result.error };

  const displayTime = clientDate || new Date();
  const timeStr = displayTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
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
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi tidak ditemukan." };
  if (!["admin", "owner", "root"].includes(user.role)) return { error: "Hanya admin dan root yang dapat mengubah pengaturan." };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({
      id: 1,
      late_time: lateTime,
      qr_expiry_hours: qrDuration,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });
  if (error) return { error: error.message };
  return { success: true };
}

export async function getAttendanceSettings() {
  const supabase = createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("late_time, qr_expiry_hours")
    .eq("id", 1)
    .maybeSingle();
  return {
    lateTime: data?.late_time || "08:00",
    qrDuration: data?.qr_expiry_hours || 12,
  };
}