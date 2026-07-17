// ============================================================
// SupabaseAuthProvider — Implementasi IAuthProvider dengan Supabase
// ============================================================

import type { IAuthProvider, AuthUser } from "../interfaces/IAuthProvider";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export class SupabaseAuthProvider implements IAuthProvider {
  async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error("[SupabaseAuthProvider.signIn] Error:", error.message);
      if (error.message?.includes("Email not confirmed") || error.message?.includes("email_not_confirmed")) {
        return { user: null, error: "Email belum dikonfirmasi. Cek inbox email kamu untuk tautan konfirmasi, atau hubungi admin." };
      }
      if (error.message?.includes("Invalid login credentials")) {
        return { user: null, error: "Email atau kata sandi salah. Pastikan email dan password benar." };
      }
      return { user: null, error: "Gagal login: " + error.message };
    }

    // Cek status approved — handle both false AND undefined
    const isApproved = data.user?.user_metadata?.approved;
    if (isApproved !== true) {
      await supabase.auth.signOut();
      return { user: null, error: "Akun Anda belum disetujui oleh admin. Silakan tunggu persetujuan." };
    }

    return {
      user: {
        id: data.user.id,
        email: data.user.email || "",
        role: data.user.user_metadata?.role,
        user_metadata: data.user.user_metadata,
      },
    };
  }

  async signUp(input: { email: string; password: string; metadata?: Record<string, any> }): Promise<{ userId?: string; error?: string }> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { approved: false, ...(input.metadata || {}) },
    });

    if (error) return { error: "Gagal membuat akun: " + error.message };
    return { userId: data.user.id };
  }

  async signOut(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      id: user.id,
      email: user.email || "",
      role: user.user_metadata?.role,
      user_metadata: user.user_metadata,
    };
  }

  async getUserById(userId: string): Promise<AuthUser | null> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error || !data?.user) return null;
    return {
      id: data.user.id,
      email: data.user.email || "",
      role: data.user.user_metadata?.role,
      user_metadata: data.user.user_metadata,
    };
  }

  async updateUser(userId: string, data: { metadata?: Record<string, any>; password?: string }): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    if (data.metadata) {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: data.metadata,
      });
      if (error) return { error: error.message };
    }

    if (data.password) {
      // Password update requires the user to be signed in
      // For admin, we need to use a different approach
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: data.password,
      });
      if (error) return { error: error.message };
    }

    return {};
  }

  async deleteUser(userId: string): Promise<{ error?: string }> {
    const supabase = createAdminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId, true);
    if (error) return { error: error.message };
    return {};
  }

  async listUsers(): Promise<{ id: string; email: string; metadata?: Record<string, any>; createdAt: string }[]> {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error || !data?.users) return [];
    return data.users.map((u) => ({
      id: u.id,
      email: u.email || "",
      metadata: u.user_metadata,
      createdAt: u.created_at,
    }));
  }

  async getUserMetadata(userId: string): Promise<Record<string, any> | null> {
    const user = await this.getUserById(userId);
    return user?.user_metadata || null;
  }
}
