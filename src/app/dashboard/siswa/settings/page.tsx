// ============================================================
// SiswaSettingsPage — Halaman Pengaturan untuk role Siswa
// ============================================================
// Halaman ini menampilkan formulir pengaturan untuk siswa,
// termasuk preferensi notifikasi, tema, mode ringkas, dan
// pengingat harian.
//
// Komponen ini adalah thin wrapper yang hanya mengatur layout
// halaman, sedangkan logika form ada di SettingsForm.
// ============================================================

import { SettingsForm } from "@/components/profile/SettingsForm";

export default function SiswaSettingsPage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      {/* 🔥 HEADER: warna pake var() biar otomatis ngikut mode gelap/terang */}
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--color-deep, #1E293B)" }}>Pengaturan</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-mist-dim, #94A3B8)" }}>
          Sesuaikan pengalaman aplikasi sesuai preferensi kamu.
        </p>
      </div>
      <SettingsForm role="siswa" />
    </div>
  );
}
