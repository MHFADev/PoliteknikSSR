"use server";

import { Repositories } from "@/lib/repositories";
import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(email: string, password: string) {
  const result = await Repositories.users().signIn(email, password);
  if (result.error) return { error: result.error };
  return { success: true };
}

export async function requestPasswordReset(email: string) {
  if (!email?.trim()) return { error: "Masukkan email terlebih dahulu." };

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/login?reset=true`,
  });

  if (error) return { error: "Gagal mengirim email reset." };

  return { success: true, message: "Link reset password telah dikirim ke email Anda." };
}