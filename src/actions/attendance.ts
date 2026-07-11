/*
 * attendance.ts — Proses Presensi Siswa
 * ==========================================
 * Server action untuk submit presensi siswa menggunakan QR token
 * (daily QR dari admin atau permanent QR milik siswa).
 *
 * Alur:
 * - Verifikasi sesi login → validasi role siswa → verifikasi QR token
 * - Jika QR daily: cari sesi yang sesuai
 * - Jika QR permanent: buat sesi otomatis jika belum ada hari ini
 * - Tentukan status "hadir" atau "telat" berdasarkan jam (cutoff 08:00)
 * - Simpan record presensi
 *
 * Keputusan teknis:
 * - Cutoff jam 08.00 — konstanta ON_TIME_CUTOFF_HOUR bisa disesuaikan
 * - Permanent QR bisa langsung trigger pembuatan sesi, jadi tanpa admin pun
 *   siswa bisa presensi dengan QR cetak permanen
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAnyToken, generateDailyToken } from "@/lib/qr-token";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

// Batas jam "hadir" — lewat dari jam ini otomatis tercatat "telat".
const ON_TIME_CUTOFF_HOUR = 8;

/**
 * submitAttendance — Proses submit presensi dari hasil scan QR
 * @param scannedToken - Token hasil scan QR (string base64url)
 * @returns Object { success, message } — hasil presensi
 *
 * Alur:
 * 1. Validasi sesi login dan role siswa
 * 2. Verifikasi token QR (daily/permanent) via HMAC
 * 3. Tentukan sessionId (daily dari token / permanent: buat otomatis)
 * 4. Cek apakah masih "hadir" (< jam cutoff) atau "telat"
 * 5. Insert ke attendance_records
 * 6. Tangani unique_violation (kode 23505) jika sudah presensi hari ini
 */
export async function submitAttendance(scannedToken: string) {
  const supabase = createClient();

  // --- Cek sesi login ---
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sesi login tidak ditemukan. Silakan login ulang." };

  // --- Cek role siswa ---
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "siswa") {
    return { success: false, message: "Hanya akun siswa yang dapat melakukan presensi." };
  }

  // --- Verifikasi token QR ---
  const verification = await verifyAnyToken(scannedToken, process.env.QR_SIGNING_SECRET!);
  if (!verification.valid) {
    return { success: false, message: verification.reason };
  }

  let sessionId: string;
  const todayDate = new Date().toISOString().slice(0, 10);

  if (verification.payload.type === "daily") {
    // --- QR Harian: cari sesi yang sesuai dari database ---
    const { sessionId: dailySessionId, date } = verification.payload;
    const { data: session } = await supabase
      .from("attendance_sessions")
      .select("id, session_date")
      .eq("id", dailySessionId)
      .maybeSingle();

    if (!session || session.session_date !== date) {
      return { success: false, message: "Sesi QR tidak ditemukan atau sudah tidak berlaku." };
    }
    sessionId = dailySessionId;
  } else if (verification.payload.type === "permanent") {
    // --- QR Permanen: pastikan QR milik user yang login ---
    if (verification.payload.studentId !== user.id) {
      return { success: false, message: "QR ini bukan milik kamu!" };
    }

    // --- Cari sesi hari ini; buat otomatis jika belum ada ---
    let { data: todaySession } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("session_date", todayDate)
      .maybeSingle();

    if (!todaySession) {
      // Buat sesi baru dengan UUID random
      const newSessionId = randomUUID();
      const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
      const token = await generateDailyToken({
        sessionId: newSessionId,
        date: todayDate,
        exp: expiresAt.getTime(),
      }, process.env.QR_SIGNING_SECRET!);

      const { data: createdSession, error: createError } = await supabase
        .from("attendance_sessions")
        .insert({
          id: newSessionId,
          session_date: todayDate,
          token,
          expires_at: expiresAt.toISOString(),
          created_by: user.id,
        })
        .select("id")
        .single();

      if (createError) {
        return { success: false, message: "Gagal memproses presensi: " + createError.message };
      }
      todaySession = createdSession!;
    }

    sessionId = todaySession.id;
  } else {
    return { success: false, message: "Jenis QR tidak dikenali." };
  }

  // --- Tentukan status hadir/telat berdasarkan jam ---
  const isOnTime = new Date().getHours() < ON_TIME_CUTOFF_HOUR;

  // --- Simpan record presensi ---
  const { error } = await supabase.from("attendance_records").insert({
    session_id: sessionId,
    student_id: user.id,
    status: isOnTime ? "hadir" : "telat",
  });

  if (error) {
    // Kode 23505 = unique_violation → siswa sudah presensi hari ini
    if (error.code === "23505") {
      return { success: false, message: "Kamu sudah melakukan presensi hari ini." };
    }
    return { success: false, message: "Gagal menyimpan presensi: " + error.message };
  }

  revalidatePath("/dashboard/siswa");
  return { success: true, message: isOnTime ? "Presensi berhasil — Hadir tepat waktu!" : "Presensi tercatat — Telat." };
}
