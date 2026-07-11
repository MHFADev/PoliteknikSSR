/*
 * page.tsx — Halaman Root (/)
 * ==========================================
 * Halaman utama aplikasi. Berfungsi sebagai router otomatis:
 * - Jika belum login → redirect ke /login
 * - Jika sudah login → redirect ke dashboard sesuai role
 *
 * Alur:
 * 1. Cek session user dari Supabase
 * 2. Jika tidak ada user → redirect ke login
 * 3. Jika ada, cek role dari tabel profiles
 * 4. Redirect ke dashboard yang sesuai (siswa/pembimbing/admin)
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Jika belum login, arahkan ke halaman login ---
  if (!user) redirect("/login");

  // --- Cari role user dan redirect ke dashboard yang sesuai ---
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  switch (profile?.role) {
    case "admin":
      redirect("/dashboard/admin");
    case "pembimbing":
      redirect("/dashboard/pembimbing");
    default:
      redirect("/dashboard/siswa");
  }
}
