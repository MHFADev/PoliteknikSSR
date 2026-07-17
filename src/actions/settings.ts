"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { Repositories } from "@/lib/repositories";

export async function getSettings(): Promise<{ lateTime: string; qrExpiryHours: number }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("app_settings")
    .select("late_time, qr_expiry_hours")
    .eq("id", 1)
    .maybeSingle();

  return {
    lateTime: data?.late_time || "08:00",
    qrExpiryHours: data?.qr_expiry_hours || 12,
  };
}

export async function saveSettings(lateTime: string, qrExpiryHours: number) {
  const user = await Repositories.users().getCurrentUser();
  if (!user) return { error: "Sesi tidak ditemukan." };
  if (!["admin", "owner", "root"].includes(user.role)) {
    return { error: "Hanya admin yang dapat mengubah pengaturan." };
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .upsert({
      id: 1,
      late_time: lateTime,
      qr_expiry_hours: qrExpiryHours,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    });

  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/absensi");
  return { success: true };
}
