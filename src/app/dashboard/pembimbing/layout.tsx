// ============================================================
// PembimbingLayout — Layout wrapper untuk semua halaman pembimbing
// ============================================================
// Bertanggung jawab untuk:
// 1. Autentikasi — redirect ke /login jika tidak ada session
// 2. Sidebar & MobileNav — navigasi dengan nama & avatar user
// 3. Main content area — padding & scroll behavior
//
// Layout ini dibungkus oleh Next.js App Router untuk semua
// rute di bawah /dashboard/pembimbing/*.
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";
import { RealtimeClock } from "@/components/RealtimeClock";
import { BlockedWatcher } from "@/components/BlockedWatcher";

export default async function PembimbingLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    /* 🔥 Layout — bg pake var() biar otomatis ngikut mode gelap/terang */
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-page, #FFFFFF)" }}>
      <BlockedWatcher />
      <Sidebar role="pembimbing" fullName={profile?.full_name ?? "Pembimbing"} avatarUrl={profile?.avatar_url ?? null} />
      <MobileNav role="pembimbing" fullName={profile?.full_name ?? "Pembimbing"} avatarUrl={profile?.avatar_url ?? null} />

      <main className="flex-1 overflow-x-hidden overflow-y-auto max-w-full" style={{ backgroundColor: "var(--bg-muted, #F0F0F0)" }}>
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-2 mb-2">
          <div />
          <RealtimeClock />
        </div>
        <div className="px-4 pb-[72px] sm:px-6 lg:px-8 lg:pb-8">{children}</div>
      </main>
    </div>
  );
}
