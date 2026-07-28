"use server";

import { Repositories } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function signInWithPassword(email: string, password: string) {
  const result = await Repositories.users().signIn(email, password);
  if (result.error) {
    if (result.error === "AKUN_BELUM_DISETUJUI") {
      return { error: "Akun Anda belum disetujui admin. Silakan tunggu persetujuan atau hubungi admin." };
    }
    if (result.error === "AKUN_DIBLOKIR") {
      return { error: "Akun Anda diblokir. Hubungi admin untuk informasi lebih lanjut." };
    }
    return { error: result.error };
  }
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  if (!email?.trim()) return { error: "Masukkan email terlebih dahulu." };

  const supabase = createClient();
  const origin = (await headers()).get("origin") || "";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin || `https://${(await headers()).get("host") || "localhost:3000"}`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/login?reset=true`,
  });

  if (error) return { error: "Gagal mengirim email reset." };

  return { success: true, message: "Link reset password telah dikirim ke email Anda." };
}