"use client";

// ============================================================
// SettingsForm — Formulir pengaturan untuk semua role
// ============================================================
// Komponen ini menampilkan formulir pengaturan yang berbeda-beda
// tergantung role user:
//
// - Siswa:
//     • Notifikasi Aplikasi (toggle)
//     • Mode Ringkas / Compact Mode (toggle)
//     • Pengingat Harian (toggle)
//     • Tema Terang/Gelap (toggle)
//
// - Pembimbing:
//     • Notifikasi Pengajuan Izin Baru (toggle)
//     • Notifikasi Kegiatan Harian Baru (toggle)
//     • Tampilan Default (select: Ringkas/Lengkap)
//     • Item per Halaman (select: 10/25/50)
//     • Notifikasi Email (toggle)
//
// - Admin:
//     • Periode PKL (tanggal mulai & selesai)
//     • QR Expiry (number, jam)
//     • Batas Waktu Hadir (number, jam)
//     • Default Radius (number, meter)
//     • Notifikasi Sistem (toggle)
//
// Cara pakai:
//   <SettingsForm role="siswa" />
//
// State management:
// - settings: object berisi semua preferensi (dari getSettings action)
// - saving: status menyimpan
// - success/error: notifikasi
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, CheckCircle2, AlertCircle, Settings, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getSettings, updateSettings } from "@/actions/profile";
import { StudentDocuments } from "@/components/StudentDocuments";
import styles from "@/styles/components/profile/Settings.module.css";

// ----------------------------------------------------------
// Tipe Props
// ----------------------------------------------------------

interface SettingsFormProps {
  /** Role user yang menentukan field mana yang ditampilkan */
  role: "siswa" | "pembimbing" | "admin" | "owner";
}

/**
 * SettingsForm — Formulir pengaturan berbasis role
 * @param role - Role user: "siswa" | "pembimbing" | "admin"
 */
export function SettingsForm({ role }: SettingsFormProps) {
  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  const [settings, setSettings] = useState<Record<string, any>>({}); // Semua nilai pengaturan
  const [loading, setLoading] = useState(true);                       // Status loading awal
  const [saving, setSaving] = useState(false);                        // Status menyimpan
  const [success, setSuccess] = useState<string | null>(null);        // Pesan sukses
  const [error, setError] = useState<string | null>(null);            // Pesan error

  // ----------------------------------------------------------
  // Fetch data settings saat komponen dimount
  // ----------------------------------------------------------
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Panggil server action getSettings untuk mendapatkan preferensi user
      const data = await getSettings();
      if (data) {
        setSettings(data);
      } else {
        setError("Gagal memuat pengaturan. Silakan refresh halaman.");
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Terjadi kesalahan saat memuat pengaturan.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ----------------------------------------------------------
  // Handler
  // ----------------------------------------------------------

  /**
   * handleToggle — Toggle boolean setting on/off
   * Menerima key settings dan membalik nilainya.
   *
   * @param key - Nama field settings yang akan di-toggle
   */
  const handleToggle = (key: string) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  /**
   * handleChange — Update nilai settings dari input (text, number, date, select)
   *
   * @param key - Nama field settings
   * @param value - Nilai baru
   */
  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  /**
   * handleSave — Simpan semua pengaturan ke server
   * Memanggil server action updateSettings.
   */
  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Panggil server action untuk menyimpan settings
      const result = await updateSettings(settings);

      if (result.success) {
        setSuccess("Pengaturan berhasil disimpan!");
      } else {
        setError(result.error || "Gagal menyimpan pengaturan.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      setError("Terjadi kesalahan saat menyimpan pengaturan.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  // Helper: render toggle switch
  // ----------------------------------------------------------

  /**
   * ToggleSwitch — Komponen toggle on/off internal
   * Menggunakan div + button pattern, tanpa dependensi tambahan.
   *
   * @param key   - Nama field settings
   * @param label - Label yang ditampilkan
   * @param desc  - Deskripsi opsional di bawah label
   */
  const ToggleSwitch = ({ key: settingKey, label, desc }: { key: string; label: string; desc?: string }) => (
    <div className={styles.toggleRow}>
      <div>
        <div className={styles.toggleLabel}>{label}</div>
        {desc && <div className={styles.toggleDesc}>{desc}</div>}
      </div>
      <button
        type="button"
        onClick={() => handleToggle(settingKey)}
        className={`${styles.toggleSwitch} ${settings[settingKey] ? styles.toggleActive : styles.toggleInactive}`}
        aria-label={label}
        aria-pressed={settings[settingKey] || false}
      >
        <span
          className={`${styles.toggleKnob} ${settings[settingKey] ? styles.toggleKnobActive : styles.toggleKnobInactive}`}
        />
      </button>
    </div>
  );

  // ----------------------------------------------------------
  // Render: Loading state
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="h-8 w-8 animate-spin text-sky" />
        <p>Memuat pengaturan...</p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render: Form pengaturan
  // ----------------------------------------------------------
  return (
    <div className={styles.pageContainer}>
      {/* Notifikasi sukses */}
      {success && (
        <div className={styles.successMsg}>
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Notifikasi error */}
      {error && (
        <div className={styles.errorMsg}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ================================================================
          SETTINGS: Siswa
          ================================================================ */}
      {role === "siswa" && (
        <>
          {/* Preferensi Tampilan */}
          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings className="h-5 w-5 text-sky" />
                <span>Preferensi Tampilan</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Atur tampilan dan notifikasi sesuai keinginan kamu.
            </p>

            {/* Theme toggle: Terang / Gelap */}
            <div className={styles.toggleRow}>
              <div>
                <div className={styles.toggleLabel}>Tema Tampilan</div>
                <div className={styles.toggleDesc}>
                  {settings.theme === "dark" ? "Gelap" : "Terang"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleChange("theme", settings.theme === "dark" ? "light" : "dark")}
                className={`${styles.toggleSwitch} ${settings.theme === "dark" ? styles.toggleActive : styles.toggleInactive}`}
                aria-label="Toggle tema"
                aria-pressed={settings.theme === "dark"}
              >
                <span
                  className={`${styles.toggleKnob} ${settings.theme === "dark" ? styles.toggleKnobActive : styles.toggleKnobInactive}`}
                />
              </button>
            </div>

            <ToggleSwitch key="notifications" label="Notifikasi Aplikasi" desc="Terima notifikasi dari aplikasi" />
            <ToggleSwitch key="compactMode" label="Mode Ringkas" desc="Tampilkan informasi secara lebih ringkas" />
            <ToggleSwitch key="dailyReminder" label="Pengingat Harian" desc="Dapatkan pengingat untuk mengisi kegiatan harian" />
          </Card>

          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FileText className="h-5 w-5 text-sky" />
                <span>Dokumen Saya</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Sertifikat PKL dan rekap nilai yang dikirim oleh admin.
              Klik Lihat untuk preview, Download untuk menyimpan ke perangkat.
            </p>
            <StudentDocuments />
          </Card>
        </>
      )}

      {/* ================================================================
          SETTINGS: Pembimbing
          ================================================================ */}
      {role === "pembimbing" && (
        <>
          {/* Notifikasi */}
          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings className="h-5 w-5 text-sky" />
                <span>Notifikasi</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Atur notifikasi yang ingin kamu terima.
            </p>

            <ToggleSwitch
              key="notifyNewLeaveRequest"
              label="Notifikasi Pengajuan Izin Baru"
              desc="Dapatkan notifikasi saat siswa mengajukan izin baru"
            />
            <ToggleSwitch
              key="notifyNewLogbook"
              label="Notifikasi Kegiatan Harian Baru"
              desc="Dapatkan notifikasi saat siswa mengisi kegiatan harian"
            />
            <ToggleSwitch
              key="notifications"
              label="Notifikasi Email"
              desc="Terima notifikasi melalui email"
            />
          </Card>

          {/* Tampilan */}
          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings className="h-5 w-5 text-sky" />
                <span>Tampilan</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Sesuaikan tampilan daftar siswa dan kegiatan harian.
            </p>

            {/* Tampilan Default */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="defaultView">
                Tampilan Default
              </label>
              <select
                id="defaultView"
                className={styles.selectInput}
                value={settings.defaultView || "ringkas"}
                onChange={(e) => handleChange("defaultView", e.target.value)}
              >
                <option value="ringkas">Ringkas</option>
                <option value="lengkap">Lengkap</option>
              </select>
            </div>

            {/* Item per Halaman */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="itemsPerPage">
                Item per Halaman
              </label>
              <select
                id="itemsPerPage"
                className={styles.selectInput}
                value={settings.itemsPerPage || 10}
                onChange={(e) => handleChange("itemsPerPage", Number(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </Card>
        </>
      )}

      {/* ================================================================
          SETTINGS: Admin
          ================================================================ */}
      {role === "admin" && (
        <>
          {/* Periode PKL */}
          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings className="h-5 w-5 text-sky" />
                <span>Periode PKL</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Atur tanggal mulai dan selesai periode Praktek Kerja Lapangan.
            </p>

            {/* Tanggal Mulai */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="pklStartDate">
                Tanggal Mulai
              </label>
              <input
                id="pklStartDate"
                type="date"
                className={styles.dateInput}
                value={settings.pklStartDate || ""}
                onChange={(e) => handleChange("pklStartDate", e.target.value)}
              />
            </div>

            {/* Tanggal Selesai */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="pklEndDate">
                Tanggal Selesai
              </label>
              <input
                id="pklEndDate"
                type="date"
                className={styles.dateInput}
                value={settings.pklEndDate || ""}
                onChange={(e) => handleChange("pklEndDate", e.target.value)}
              />
            </div>
          </Card>

          {/* Presensi */}
          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings className="h-5 w-5 text-sky" />
                <span>Presensi</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Atur konfigurasi presensi QR code.
            </p>

            {/* QR Expiry */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="qrExpiryHours">
                QR Expiry (jam)
              </label>
              <input
                id="qrExpiryHours"
                type="number"
                className={styles.numberInput}
                value={settings.qrExpiryHours || 12}
                onChange={(e) => handleChange("qrExpiryHours", Number(e.target.value))}
                min={1}
                max={24}
              />
              <div className={styles.toggleDesc}>Berapa lama QR code berlaku sebelum kadaluarsa.</div>
            </div>

            {/* Batas Waktu Hadir */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="attendanceCutoffHour">
                Batas Waktu Hadir (jam)
              </label>
              <input
                id="attendanceCutoffHour"
                type="number"
                className={styles.numberInput}
                value={settings.attendanceCutoffHour || 8}
                onChange={(e) => handleChange("attendanceCutoffHour", Number(e.target.value))}
                min={1}
                max={23}
              />
              <div className={styles.toggleDesc}>
                Batas maksimal jam presensi sebelum dianggap telat. Default: jam 8.
              </div>
            </div>
          </Card>

          {/* Lokasi */}
          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings className="h-5 w-5 text-sky" />
                <span>Lokasi</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Atur radius default untuk verifikasi lokasi presensi.
            </p>

            {/* Default Radius */}
            <div className={styles.formField}>
              <label className={styles.formLabel} htmlFor="defaultLocationRadius">
                Default Radius (meter)
              </label>
              <input
                id="defaultLocationRadius"
                type="number"
                className={styles.numberInput}
                value={settings.defaultLocationRadius || 100}
                onChange={(e) => handleChange("defaultLocationRadius", Number(e.target.value))}
                min={10}
                max={1000}
              />
              <div className={styles.toggleDesc}>
                Radius geofence default saat menambah lokasi baru. Default: 100 meter.
              </div>
            </div>
          </Card>

          {/* Notifikasi */}
          <Card variant="skylearn">
            <div className={styles.formSectionTitle}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Settings className="h-5 w-5 text-sky" />
                <span>Notifikasi</span>
              </div>
            </div>
            <p className={styles.formSectionDesc}>
              Atur notifikasi sistem untuk pengguna.
            </p>

            <ToggleSwitch key="notifications" label="Notifikasi Sistem" desc="Kirim notifikasi sistem ke semua pengguna" />
          </Card>
        </>
      )}

      {/* Tombol simpan — muncul di semua role */}
      <div className={styles.formActions}>
        <Button
          variant="primary"
          size="md"
          isLoading={saving}
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          Simpan Pengaturan
        </Button>
      </div>
    </div>
  );
}
