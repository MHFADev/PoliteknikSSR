import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
