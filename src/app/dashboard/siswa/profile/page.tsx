// ============================================================
// SiswaProfilePage — Halaman Profil untuk role Siswa
// ============================================================
// Halaman ini menampilkan formulir profil yang bisa digunakan
// oleh siswa untuk mengedit data diri dan mengganti password.
//
// Komponen ini adalah thin wrapper yang hanya mengatur layout
// halaman, sedangkan logika form ada di ProfileForm.
// ============================================================

import { ProfileForm } from "@/components/profile/ProfileForm";

export default function SiswaProfilePage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* 🔥 HEADER: warna pake var(--color-deep) biar otomatis ngikut mode gelap/terang */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-deep, #1E293B)" }}>Profil Saya</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-mist-dim, #94A3B8)" }}>
          Kelola data diri dan password akun kamu.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}
