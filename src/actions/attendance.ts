"use server";

import { createClient } from "@/lib/supabase/server";
import { verifyAnyToken, generateDailyToken } from "@/lib/qr-token";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

// Batas jam "hadir" — lewat dari jam ini otomatis tercatat "telat".
// Sesuaikan dengan kebijakan instansi masing-masing.
const ON_TIME_CUTOFF_HOUR = 8;

export async function submitAttendance(scannedToken: string) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Sesi login tidak ditemukan. Silakan login ulang." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "siswa") {
    return { success: false, message: "Hanya akun siswa yang dapat melakukan presensi." };
  }

  const verification = await verifyAnyToken(scannedToken, process.env.QR_SIGNING_SECRET!);
  if (!verification.valid) {
    return { success: false, message: verification.reason };
  }

  let sessionId: string;
  const todayDate = new Date().toISOString().slice(0, 10);

  if (verification.payload.type === "daily") {
    // Use daily session from token
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
    // Permanent token: first ensure that we're using the correct studentId
    // Also check that the token's studentId matches the logged-in user (can't use someone else's QR!)
    if (verification.payload.studentId !== user.id) {
      return { success: false, message: "QR ini bukan milik kamu!" };
    }

    // Now check if there's an existing attendance session today; if not, create it automatically!
    let { data: todaySession } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("session_date", todayDate)
      .maybeSingle();

    if (!todaySession) {
      // Create a new session automatically if one doesn't exist yet
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
          created_by: user.id, // Even student can trigger creation, but that's okay
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

  const isOnTime = new Date().getHours() < ON_TIME_CUTOFF_HOUR;

  const { error } = await supabase.from("attendance_records").insert({
    session_id: sessionId,
    student_id: user.id,
    status: isOnTime ? "hadir" : "telat",
  });

  if (error) {
    // Kode 23505 = unique_violation -> siswa sudah presensi hari ini
    if (error.code === "23505") {
      return { success: false, message: "Kamu sudah melakukan presensi hari ini." };
    }
    return { success: false, message: "Gagal menyimpan presensi: " + error.message };
  }

  revalidatePath("/dashboard/siswa");
  return { success: true, message: isOnTime ? "Presensi berhasil — Hadir tepat waktu!" : "Presensi tercatat — Telat." };
}
