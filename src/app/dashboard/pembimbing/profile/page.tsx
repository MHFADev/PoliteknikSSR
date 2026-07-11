// ============================================================
// PembimbingProfilePage — Halaman Profil untuk role Pembimbing
// ============================================================
// Halaman ini menampilkan formulir profil yang bisa digunakan
// oleh pembimbing untuk mengedit data diri dan mengganti password.
//
// Komponen ini adalah thin wrapper yang hanya mengatur layout
// halaman, sedangkan logika form ada di ProfileForm.
// ============================================================

import { ProfileForm } from "@/components/profile/ProfileForm";

export default function PembimbingProfilePage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1E293B" }}>Profil Saya</h1>
        <p style={{ fontSize: "0.875rem", color: "#94A3B8" }}>
          Kelola data diri dan password akun kamu.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
