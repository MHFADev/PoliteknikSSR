import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function SiswaLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="siswa" fullName={profile?.full_name ?? "Siswa"} />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">{children}</main>
    </div>
  );
}
