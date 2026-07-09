"use server";

import { createClient } from "@/lib/supabase/server";

export async function signInWithPassword(email: string, password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email atau kata sandi salah." };
  }
  return { success: true };
}
