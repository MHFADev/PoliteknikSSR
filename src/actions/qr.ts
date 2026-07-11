/*
 * qr.ts — Manajemen Sesi QR Presensi Harian
 * ==========================================
 * Server actions untuk generate sesi QR harian (Admin) dan
 * mengambil sesi QR yang aktif hari ini.
 *
 * Alur:
 * - generateTodaySession: Admin membuat sesi QR baru (upsert per tanggal)
 * - getTodaySession: Ambil sesi QR yang sudah ada hari ini
 *
 * Keputusan teknis:
 * - Sesi QR memiliki masa berlaku 12 jam (SESSION_DURATION_HOURS)
 * - Upsert dengan onConflict("session_date") memastikan hanya 1 sesi per hari
 * - Token QR ditandatangani HMAC (lihat qr-token.ts)
 */

"use server";

import { createClient } from "@/lib/supabase/server";
import { generateDailyToken } from "@/lib/qr-token";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

/** Durasi berlaku sesi QR dalam jam */
const SESSION_DURATION_HOURS = 12;

/**
 * generateTodaySession — Buat sesi QR baru untuk hari ini (Admin only)
 * @returns Object { data: session } atau { error }
 *
 * Alur:
 * 1. Cek sesi login
 * 2. Verifikasi role admin
 * 3. Generate UUID, tanggal hari ini, dan expiry time
 * 4. Buat signed token HMAC dari payload
 * 5. Upsert ke attendance_sessions (onConflict: session_date)
 * 6. Revalidate halaman QR admin
 */
export async function generateTodaySession() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesi login tidak ditemukan." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return { error: "Hanya Admin yang dapat membuat sesi QR." };
  }

  const sessionId = randomUUID();
  const sessionDate = new Date().toISOString().slice(0, 10);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_HOURS * 60 * 60 * 1000);

  // --- Generate token QR yang ditandatangani ---
  const token = await generateDailyToken(
    { sessionId, date: sessionDate, exp: expiresAt.getTime() },
    process.env.QR_SIGNING_SECRET!
  );

  // --- Simpan sesi (upsert — 1 sesi per hari) ---
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

/**
 * getTodaySession — Ambil sesi QR yang aktif hari ini
 * @returns Session object atau null jika belum ada sesi
 */
export async function getTodaySession() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("session_date", today)
    .maybeSingle();

  return data;
}