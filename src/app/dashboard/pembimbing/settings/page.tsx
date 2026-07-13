// ============================================================
// PembimbingSettingsPage — Halaman Pengaturan untuk role Pembimbing
// ============================================================
// Halaman ini menampilkan formulir pengaturan untuk pembimbing,
// termasuk notifikasi pengajuan izin, kegiatan harian, tampilan
// default, dan jumlah item per halaman.
//
// Komponen ini adalah thin wrapper yang hanya mengatur layout
// halaman, sedangkan logika form ada di SettingsForm.
// ============================================================

import { SettingsForm } from "@/components/profile/SettingsForm";

export default function PembimbingSettingsPage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1E293B" }}>Pengaturan</h1>
        <p style={{ fontSize: "0.875rem", color: "#94A3B8" }}>
          Sesuaikan pengalaman aplikasi sesuai preferensi kamu.
        </p>
      </div>
      <SettingsForm role="pembimbing" />
    </div>
  );
}
