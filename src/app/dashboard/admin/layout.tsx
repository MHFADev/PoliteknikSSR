// ============================================================
// AdminLayout — Layout wrapper untuk semua halaman admin
// ============================================================
// Bertanggung jawab untuk:
// 1. Autentikasi — redirect ke /login jika tidak ada session
// 2. Sidebar & MobileNav — navigasi dengan nama & avatar user
// 3. Main content area — padding & scroll behavior
//
// Layout ini dibungkus oleh Next.js App Router untuk semua
// rute di bawah /dashboard/admin/*.
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  // Cek autentikasi — redirect jika belum login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Ambil profil user untuk sidebar (nama + avatar)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.role === "owner" ? "owner" : "admin") as "admin" | "owner";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar desktop — tampil di layar >= 1024px */}
      <Sidebar role={userRole} fullName={profile?.full_name ?? "Admin"} avatarUrl={profile?.avatar_url ?? null} />

      {/* MobileNav — header + bottom nav untuk mobile */}
      <MobileNav role={userRole} fullName={profile?.full_name ?? "Admin"} avatarUrl={profile?.avatar_url ?? null} />

      {/* Main content area — scrollable, padding responsif */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 bg-mist-soft max-w-full pb-[72px] lg:pb-8">
        {children}
      </main>
    </div>
  );
}
