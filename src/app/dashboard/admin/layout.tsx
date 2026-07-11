/*
 * layout.tsx — Dashboard Layout Admin
 * ==========================================
 * Layout khusus untuk halaman dashboard admin.
 * Menyediakan Sidebar dengan navigasi admin dan container konten utama.
 *
 * Alur:
 * 1. Cek sesi login — redirect ke /login jika tidak ada
 * 2. Cari profil user untuk mendapatkan nama (ditampilkan di sidebar)
 * 3. Render Sidebar (role: admin) + konten halaman
 *
 * Proteksi:
 * - Middleware sudah memfilter akses berdasarkan role,
 *   namun layout juga melakukan pengecekan sesi sebagai lapisan tambahan
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar role="admin" fullName={profile?.full_name ?? "Admin"} />
      <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 bg-mist-soft">{children}</main>
    </div>
  );
}
