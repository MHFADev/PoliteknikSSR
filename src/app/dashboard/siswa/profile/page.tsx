// ============================================================
// SiswaProfilePage — Halaman Profil untuk role Siswa
// ============================================================
// Halaman ini menampilkan formulir profil yang bisa digunakan
// oleh siswa untuk mengedit data diri dan mengganti password.
//
// Komponen ini adalah thin wrapper yang hanya mengatur layout
// halaman, sedangkan logika form ada di ProfileForm.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { MentorSelector } from "@/components/siswa/MentorSelector";
import styles from "@/styles/components/profile/Profile.module.css";

export default async function SiswaProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("jurusan_id")
    .eq("id", user!.id)
    .single();

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Profil Saya</h1>
        <p>Kelola data diri, pembimbing, dan password akun kamu.</p>
      </div>

      <div data-tour="profile-mentor">
        <MentorSelector studentJurusanId={profile?.jurusan_id} profileMode />
      </div>

      <ProfileForm />
    </div>
  );
}
