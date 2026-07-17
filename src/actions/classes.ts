"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getClasses(): Promise<{ id: string; nama: string }[]> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("classes").select("id, nama").order("nama", { ascending: true });
  return (data as any[]) || [];
}

export async function addClass(nama: string): Promise<{ id?: string; error?: string }> {
  const trimmed = nama.trim();
  if (!trimmed) return { error: "Nama kelas tidak boleh kosong." };
  if (!/^\d+$/.test(trimmed)) return { error: "Kelas hanya boleh berisi angka." };

  const supabase = createAdminClient();
  const { data, error } = await supabase.from("classes").insert({ nama: trimmed }).select("id").single();
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kelas");
  return { id: data.id };
}

export async function renameClass(id: string, nama: string): Promise<{ error?: string }> {
  const trimmed = nama.trim();
  if (!trimmed) return { error: "Nama kelas tidak boleh kosong." };
  if (!/^\d+$/.test(trimmed)) return { error: "Kelas hanya boleh berisi angka." };

  const supabase = createAdminClient();
  const { error } = await supabase.from("classes").update({ nama: trimmed }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kelas");
  return {};
}

export async function deleteClass(id: string): Promise<{ error?: string }> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("classes").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/dashboard/admin/kelas");
  return {};
}