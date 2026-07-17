"use server";

import { Repositories } from "@/lib/repositories";
import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { generateDailyToken } from "@/lib/qr-token";

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

export async function autoCheckinByGps(latitude: number, longitude: number, clientTimestamp?: string) {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { success: false, message: "Sesi login tidak ditemukan." };
  if (user.role !== "siswa") return { success: false, message: "Hanya siswa." };

  const supabase = createClient();
  const adminSupabase = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);
  const clientDate = clientTimestamp ? new Date(clientTimestamp) : undefined;

  // Cek sudah absen hari ini
  const { data: existing } = await supabase
    .from("attendance_records")
    .select("id, status")
    .eq("student_id", user.id)
    .gte("scanned_at", `${today}T00:00:00`)
    .lte("scanned_at", `${today}T23:59:59`)
    .maybeSingle();
  if (existing) return { success: false, message: `Kamu sudah absen hari ini (${existing.status === "hadir" ? "Hadir" : "Telat"}).` };

  // Verifikasi lokasi
  const locResult = await Repositories.location().verifyLocation(latitude, longitude);
  if (!locResult.allowed) return { success: false, message: "Berada di luar area yang diizinkan." };

  // Ambil settings
  const { data: settings } = await supabase
    .from("app_settings")
    .select("late_time, qr_expiry_hours")
    .eq("id", 1)
    .maybeSingle();
  const qrExpiryHours = settings?.qr_expiry_hours || 12;
  const lateTime = settings?.late_time || "08:00";

  // Cari sesi hari ini; buat otomatis jika belum ada
  let { data: session } = await supabase
    .from("attendance_sessions")
    .select("id")
    .eq("session_date", today)
    .maybeSingle();

  if (!session) {
    const sid = randomUUID();
    const exp = new Date(Date.now() + qrExpiryHours * 60 * 60 * 1000);
    const token = await generateDailyToken({ sessionId: sid, date: today, exp: exp.getTime() }, process.env.QR_SIGNING_SECRET!);
    const { data: cs } = await adminSupabase.from("attendance_sessions").insert({ id: sid, session_date: today, token, expires_at: exp.toISOString(), created_by: user.id }).select("id").single();
    if (!cs) return { success: false, message: "Gagal membuat sesi." };
    session = cs;
  }

  // Tentukan hadir/telat
  const checkTime = clientDate || new Date();
  const [h, m] = lateTime.split(":").map(Number);
  const isOnTime = checkTime.getHours() * 60 + checkTime.getMinutes() < h * 60 + m;
  const status = isOnTime ? "hadir" : "telat";

  const { error } = await adminSupabase.from("attendance_records").insert({ session_id: session.id, student_id: user.id, status });
  if (error) return { success: false, message: "Gagal menyimpan presensi." };

  const timeStr = checkTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  const name = user.fullName || "Siswa";
  revalidatePath("/dashboard/siswa");
  return {
    success: true,
    status,
    name,
    time: timeStr,
    locationName: locResult.locationName || null,
    message: status === "hadir"
      ? `${name}, anda hadir tepat waktu pukul ${timeStr}.`
      : `${name}, anda telat. Absen pukul ${timeStr}.`,
  };
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