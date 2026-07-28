import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/profile/SettingsForm";
import { MentorSelector } from "@/components/siswa/MentorSelector";

export default async function SiswaSettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("jurusan_id")
    .eq("id", user!.id)
    .single();

  return (
    <div style={{ padding: "1.5rem", maxWidth: "48rem", margin: "0 auto" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-deep, #1E293B)" }}>Pengaturan</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-mist-dim, #94A3B8)" }}>
          Sesuaikan pengalaman aplikasi sesuai preferensi kamu.
        </p>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <MentorSelector studentJurusanId={profile?.jurusan_id} profileMode />
      </div>

      <SettingsForm role="siswa" />
    </div>
  );
}