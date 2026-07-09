"use server";

import { createClient } from "@/lib/supabase/server";
import { generateDailyToken } from "@/lib/qr-token";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

const SESSION_DURATION_HOURS = 12; // QR berlaku dari digenerate sampai 12 jam ke depan

export async function generateTodaySession() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  // Verifikasi role di server, jangan percaya klaim role dari client
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { error: "Hanya Admin yang dapat membuat sesi QR." };
  }

  const sessionId = randomUUID();
  const sessionDate = new Date().toISOString().slice(0, 10);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  const token = await generateDailyToken(
    { sessionId, date: sessionDate, exp: expiresAt.getTime() },
    process.env.QR_SIGNING_SECRET!
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
      { onConflict: "session_date" }
    )
    .select()
    .single();

  if (error) return { error: "Gagal membuat sesi QR: " + error.message };

  revalidatePath("/dashboard/admin/qr");
  return { data };
}

export async function getTodaySession() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("session_date", today)
    .maybeSingle();
  return data;
}
