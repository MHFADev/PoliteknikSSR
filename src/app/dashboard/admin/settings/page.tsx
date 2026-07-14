// ============================================================
// AdminSettingsPage — Halaman Pengaturan untuk role Admin
// ============================================================
// Halaman ini menampilkan formulir pengaturan untuk admin,
// termasuk periode PKL, konfigurasi presensi QR, radius lokasi,
// dan notifikasi sistem.
//
// Komponen ini adalah thin wrapper yang hanya mengatur layout
// halaman, sedangkan logika form ada di SettingsForm.
// ============================================================

import { SettingsForm } from "@/components/profile/SettingsForm";

export default function AdminSettingsPage() {
  return (
    <div style={{ padding: "1.5rem" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1E293B" }}>
          Pengaturan
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#94A3B8" }}>
          Sesuaikan pengalaman aplikasi sesuai preferensi kamu
        </p>
      </div>
      <SettingsForm role="admin" />
    </div>
  );
}
