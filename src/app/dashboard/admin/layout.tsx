import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <main className="flex-1 overflow-y-auto p-4 pt-16 sm:p-6 sm:pt-6 lg:p-8 bg-mist-soft">
        {children}
      </main>
    </div>
  );
}
