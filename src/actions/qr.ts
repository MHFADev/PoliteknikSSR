"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { Repositories } from "@/lib/repositories";
import { generateDailyToken } from "@/lib/qr-token";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

async function getQrExpiryHours(): Promise<number> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("app_settings")
      .select("qr_expiry_hours")
      .eq("id", 1)
      .maybeSingle();
    return data?.qr_expiry_hours || 12;
  } catch {
    return 12;
  }
}

/**
 * generateTodaySession — Buat sesi QR baru untuk hari ini (Admin only)
 * Alur:
 * 1. Ambil user login via repository
 * 2. Verifikasi role admin
 * 3. Generate sessionId, tanggal, expiry
 * 4. Buat signed token HMAC (sessionId tertanam di payload)
 * 5. Upsert ke attendance_sessions (sessionId HARUS cocok dengan yg di token)
 *
 * Catatan: Upsert dilakukan langsung via createAdminClient karena
 * AttendanceRepository.createSession() mengenerate sessionId sendiri,
 * sementara token membutuhkan sessionId yang SAMA di DB dan di payload.
 */
export async function generateTodaySession() {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };
  if (user.role !== "admin" && user.role !== "pembimbing") {
    return { error: "Hanya Admin dan Pembimbing yang dapat membuat sesi QR." };
  }

  const sessionId = randomUUID();
  const sessionDate = new Date().toISOString().slice(0, 10);
  const durationHours = await getQrExpiryHours();
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  // --- Generate token QR yg ditandatangani (sessionId tertanam di payload) ---
  const token = await generateDailyToken(
    { sessionId, date: sessionDate, exp: expiresAt.getTime() },
    process.env.QR_SIGNING_SECRET!
  );

  // --- Upsert: 1 sesi per hari, sessionId harus cocok dengan yg di token ---
  const supabase = createAdminClient();
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
  return {
    data: {
      id: data.id,
      sessionDate: data.session_date,
      token: data.token,
      expiresAt: data.expires_at,
      createdBy: data.created_by,
      createdAt: data.created_at,
    },
  };
}

/**
 * getTodaySession — Ambil sesi QR yg aktif hari ini via repository
 */
export async function getTodaySession() {
  const session = await Repositories.attendance().getTodaySession();
  if (!session) return null;
  return {
    id: session.id,
    sessionDate: session.sessionDate,
    token: session.token,
    expiresAt: session.expiresAt,
    createdBy: session.createdBy,
    createdAt: session.createdAt,
  };
}
