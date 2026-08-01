import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, identity_number")
    .eq("id", user.id)
    .maybeSingle();

  const meta = user.app_metadata as Record<string, any> | undefined;
  const isGoogleUser =
    meta?.provider === "google" ||
    (Array.isArray(meta?.providers) && meta.providers.includes("google"));

  if (!profile) {
    redirect("/complete-profile");
  }

  // Complete-profile hanya untuk user login Google (data belum lengkap).
  // User register manual sudah mengisi data saat mendaftar.
  if (
    isGoogleUser &&
    (profile.full_name === "Pengguna Baru" || !profile.identity_number)
  ) {
    redirect("/complete-profile");
  }

  switch (profile.role) {
    case "admin": case "owner": case "root":
      redirect("/dashboard/admin");
    case "pembimbing":
      redirect("/dashboard/pembimbing");
    default:
      redirect("/dashboard/siswa");
  }
}