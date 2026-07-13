"use server";

import { Repositories } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * getProfile — Ambil data profil user yang sedang login
 * Mengembalikan objek User dari repository, atau null jika belum login.
 */
export async function getProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await Repositories.users().getCurrentUser();
  return profile;
}

/**
 * updateProfile — Update data profil user (nama, NIS, instansi, kelas)
 * Menerima partial data profil dan menyimpannya ke database.
 *
 * @param data - Object berisi field yang akan diubah (fullName, identityNumber, instansi, kelas)
 * @returns { success: true } jika berhasil, atau { error: string } jika gagal
 */
export async function updateProfile(data: {
  fullName?: string;
  identityNumber?: string;
  instansi?: string;
  kelas?: string;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const result = await Repositories.users().updateProfile(user.id, data);
  if (result.error) return { error: result.error };

  revalidatePath("/dashboard/siswa/profile");
  revalidatePath("/dashboard/pembimbing/profile");
  revalidatePath("/dashboard/admin/profile");
  return { success: true };
}

/**
 * changePassword — Ganti password user
 * Memverifikasi password saat ini terlebih dahulu sebelum mengubah ke password baru.
 *
 * @param currentPassword - Password user saat ini (untuk verifikasi)
 * @param newPassword - Password baru yang akan disimpan
 * @returns { success: true } jika berhasil, atau { error: string } jika gagal
 */
export async function changePassword(currentPassword: string, newPassword: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: "Tidak terautentikasi." };

  // Verifikasi password saat ini dengan mencoba login ulang
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });
  if (signInError) return { error: "Password saat ini salah." };

  // Update ke password baru
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { error: "Gagal mengubah password: " + error.message };

  return { success: true };
}

/**
 * getSettings — Ambil preferensi user dari user_metadata
 * Mengembalikan object settings dengan default value jika belum pernah disimpan.
 * Default value berbeda-beda tergantung role user.
 */
export async function getSettings() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Default global untuk semua role
  const defaults: Record<string, any> = {
    compactMode: false,
    itemsPerPage: 10,
    notifications: true,
  };

  // Default khusus admin
  if (user.user_metadata?.role === "admin") {
    defaults.pklStartDate = "";
    defaults.pklEndDate = "";
    defaults.qrExpiryHours = 12;
    defaults.attendanceCutoffHour = 8;
    defaults.defaultLocationRadius = 100;
  }

  // Default khusus pembimbing
  if (user.user_metadata?.role === "pembimbing") {
    defaults.notifyNewLeaveRequest = true;
    defaults.notifyNewLogbook = true;
  }

  // Default khusus siswa
  if (user.user_metadata?.role === "siswa") {
    defaults.dailyReminder = false;
  }

  // Gabungkan default dengan settings yang sudah tersimpan (jika ada)
  const settings = user.user_metadata?.settings || {};
  return { ...defaults, ...settings };
}

/**
 * updateSettings — Simpan preferensi user ke user_metadata
 * Menggabungkan settings baru ke dalam metadata user tanpa menimpa metadata lain.
 *
 * @param settings - Object berisi pasangan key-value yang akan disimpan
 * @returns { success: true } jika berhasil, atau { error: string } jika gagal
 */
export async function updateSettings(settings: Record<string, any>) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tidak terautentikasi." };

  const currentMetadata = user.user_metadata || {};
  const currentSettings = currentMetadata.settings || {};

  // Simpan ke user_metadata.settings tanpa menghapus metadata lain
  const { error } = await supabase.auth.updateUser({
    data: {
      ...currentMetadata,
      settings: { ...currentSettings, ...settings },
    },
  });

  if (error) return { error: "Gagal menyimpan pengaturan: " + error.message };

  revalidatePath("/dashboard/siswa/settings");
  revalidatePath("/dashboard/pembimbing/settings");
  revalidatePath("/dashboard/admin/settings");
  return { success: true };
}
