"use server";

import { createClient } from "@/lib/supabase/server";
import { generateDailyToken } from "@/lib/qr-token";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

const SESSION_DURATION_HOURS = 12; // QR berlaku dari digenerate sampai 12 jam ke depan
<<<<<<< HEAD
const TIMEZONE = "Asia/Jakarta";

// Ambil tanggal "hari ini" berdasarkan waktu lokal, bukan UTC,
// supaya tidak roll-over lebih awal (UTC+7 -> jam 17:00 WIB = tengah malam UTC).
function getLocalDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date); // en-CA formats as YYYY-MM-DD
}

export async function generateTodaySession() {
  const supabase = await createClient(); // <-- await added
=======

export async function generateTodaySession() {
  const supabase = createClient();
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  // Verifikasi role di server, jangan percaya klaim role dari client
<<<<<<< HEAD
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

=======
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  if (profile?.role !== "admin") {
    return { error: "Hanya Admin yang dapat membuat sesi QR." };
  }

  const sessionId = randomUUID();
<<<<<<< HEAD
  const sessionDate = getLocalDateString();
  const expiresAt = new Date(
    Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000,
  );

  const token = await generateDailyToken(
    { sessionId, date: sessionDate, exp: expiresAt.getTime() },
    process.env.QR_SIGNING_SECRET!,
=======
  const sessionDate = new Date().toISOString().slice(0, 10);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const token = await generateDailyToken(
    { sessionId, date: sessionDate, exp: expiresAt.getTime() },
    process.env.QR_SIGNING_SECRET!
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  );

  // upsert supaya generate ulang di hari yang sama tidak bentrok dengan constraint unique(session_date)
  const { data, error } = await supabase
    .from("attendance_sessions")
    .upsert(
      {
        id: sessionId,
        session_date: sessionDate,
        token,
        expires_at: expiresAt.toISOString(),
        created_by: user.id,
      },
<<<<<<< HEAD
      { onConflict: "session_date" },
=======
      { onConflict: "session_date" }
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
    )
    .select()
    .single();

  if (error) return { error: "Gagal membuat sesi QR: " + error.message };

  revalidatePath("/dashboard/admin/qr");
  return { data };
}

export async function getTodaySession() {
<<<<<<< HEAD
  const supabase = await createClient(); // <-- await added
  const today = getLocalDateString();

  const { data, error } = await supabase
=======
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
    .from("attendance_sessions")
    .select("*")
    .eq("session_date", today)
    .maybeSingle();
<<<<<<< HEAD

  if (error) {
    console.error("Gagal mengambil sesi QR hari ini:", error.message);
    return null;
  }

=======
>>>>>>> 5602bf6251f6241e94348fd05940a4cef1aa68e0
  return data;
}
