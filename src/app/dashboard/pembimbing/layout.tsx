import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { MobileNav } from "@/components/layout/MobileNav";

export default async function PembimbingLayout({ children }: { children: React.ReactNode }) {
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
      <Sidebar role="pembimbing" fullName={profile?.full_name ?? "Pembimbing"} />
      <MobileNav role="pembimbing" fullName={profile?.full_name ?? "Pembimbing"} />
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 bg-mist-soft max-w-full pb-[72px] lg:pb-8">{children}</main>
    </div>
  );
}