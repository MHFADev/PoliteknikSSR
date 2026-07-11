"use client";

// ============================================================
// ProfileForm — Formulir profil yang bisa dipakai semua role
// ============================================================
// Komponen ini menangani:
// 1. Menampilkan data profil user saat ini (read-only untuk email & role)
// 2. Mengedit Nama Lengkap, NIS/NIM, Instansi, Kelas
// 3. Mengganti password (dengan verifikasi password lama)
// 4. Menampilkan pesan sukses/error setelah operasi
//
// Cara pakai:
//   <ProfileForm />
//
// State management:
// - user: data user dari server (di-fetch via getProfile action)
// - formData: data form yang sedang diedit (controlled component)
// - loading: status loading saat fetch/save
// - success/error: status notifikasi
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { User, Save, Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getProfile, updateProfile, changePassword } from "@/actions/profile";
import type { User as UserType } from "@/lib/repositories/types";
import styles from "@/styles/components/profile/Profile.module.css";

/**
 * ProfileForm — Komponen utama form profil
 * Tidak menerima props karena data user diambil dari session.
 */
export function ProfileForm() {
  // ----------------------------------------------------------
  // State untuk data user & form
  // ----------------------------------------------------------
  const [user, setUser] = useState<UserType | null>(null);         // Data user dari server
  const [loading, setLoading] = useState(true);                     // Status loading awal
  const [saving, setSaving] = useState(false);                      // Status menyimpan profil
  const [changingPassword, setChangingPassword] = useState(false);  // Status mengganti password
  const [success, setSuccess] = useState<string | null>(null);      // Pesan sukses
  const [error, setError] = useState<string | null>(null);          // Pesan error

  // State untuk form profil
  const [formData, setFormData] = useState({
    fullName: "",
    identityNumber: "",
    instansi: "",
    kelas: "",
  });

  // State untuk form ganti password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ----------------------------------------------------------
  // Fetch data user saat komponen dimount
  // ----------------------------------------------------------
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Panggil server action getProfile untuk mendapatkan data user
      const profile = await getProfile();

      if (profile) {
        setUser(profile);
        // Isi form dengan data user yang ada
        setFormData({
          fullName: profile.fullName || "",
          identityNumber: profile.identityNumber || "",
          instansi: profile.instansi || "",
          kelas: profile.kelas || "",
        });
      } else {
        setError("Gagal memuat data profil. Silakan refresh halaman.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Terjadi kesalahan saat memuat data profil.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ----------------------------------------------------------
  // Handler form profil
  // ----------------------------------------------------------

  /**
   * handleInputChange — Update state formData saat user mengetik
   * @param e - Event dari input element
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * handleSaveProfile — Simpan perubahan profil ke server
   * Memanggil server action updateProfile.
   */
  const handleSaveProfile = async () => {
    // Validasi: Nama Lengkap wajib diisi
    if (!formData.fullName.trim()) {
      setError("Nama Lengkap wajib diisi.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Panggil server action untuk update profil
      const result = await updateProfile({
        fullName: formData.fullName,
        identityNumber: formData.identityNumber,
        instansi: formData.instansi,
        kelas: formData.kelas,
      });

      if (result.success) {
        setSuccess("Profil berhasil diperbarui!");
        // Refresh data user dengan data terbaru
        const updatedProfile = await getProfile();
        if (updatedProfile) setUser(updatedProfile);
      } else {
        setError(result.error || "Gagal menyimpan profil.");
      }
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  // Handler ganti password
  // ----------------------------------------------------------

  /**
   * handlePasswordChange — Update state passwordData saat user mengetik
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * handleChangePassword — Ganti password user
   * Validasi: password baru minimal 6 karakter & harus sama dengan konfirmasi.
   */
  const handleChangePassword = async () => {
    // Validasi: password baru minimal 6 karakter
    if (passwordData.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }

    // Validasi: konfirmasi password harus sama
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }

    // Validasi: password saat ini tidak boleh kosong
    if (!passwordData.currentPassword) {
      setError("Password saat ini wajib diisi.");
      return;
    }

    try {
      setChangingPassword(true);
      setError(null);
      setSuccess(null);

      // Panggil server action untuk ganti password
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        setSuccess("Password berhasil diubah!");
        // Reset form password
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        setError(result.error || "Gagal mengubah password.");
      }
    } catch (err) {
      console.error("Error changing password:", err);
      setError("Terjadi kesalahan saat mengubah password.");
    } finally {
      setChangingPassword(false);
    }
  };

  // ----------------------------------------------------------
  // Helper: dapatkan class badge berdasarkan role
  // ----------------------------------------------------------
  const getBadgeClass = (role: string) => {
    switch (role) {
      case "siswa":
        return styles.badgeSiswa;
      case "pembimbing":
        return styles.badgePembimbing;
      case "admin":
        return styles.badgeAdmin;
      default:
        return "";
    }
  };

  // ----------------------------------------------------------
  // Render: Loading state
  // ----------------------------------------------------------
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className="h-8 w-8 animate-spin text-sky" />
        <p>Memuat data profil...</p>
      </div>
    );
  }

  // ----------------------------------------------------------
  // Render: Form profil
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

      {/* ==========================================
          SECTION 1: Data Profil
          ========================================== */}
      <Card variant="skylearn">
        <div className={styles.formSectionTitle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User className="h-5 w-5 text-sky" />
            <span>Data Profil</span>
          </div>
        </div>
        <p className={styles.formSectionDesc}>
          Informasi diri kamu. Email dan Role tidak bisa diubah.
        </p>

        {/* Nama Lengkap */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="fullName">
            Nama Lengkap <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            className={styles.formInput}
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Masukkan nama lengkap"
          />
        </div>

        {/* Email — readonly */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={styles.formInputDisabled}
            value={user?.email || ""}
            disabled
          />
        </div>

        {/* Role — ditampilkan sebagai badge */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>Role</label>
          <div>
            {user?.role && (
              <span className={`${styles.badge} ${getBadgeClass(user.role)}`}>
                {user.role === "siswa"
                  ? "Siswa"
                  : user.role === "pembimbing"
                  ? "Pembimbing"
                  : "Admin"}
              </span>
            )}
          </div>
        </div>

        {/* NIS/NIM — hanya untuk siswa */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="identityNumber">
            {user?.role === "siswa" ? "NIS" : "NIP / NIK"}
          </label>
          <input
            id="identityNumber"
            name="identityNumber"
            type="text"
            className={styles.formInput}
            value={formData.identityNumber}
            onChange={handleInputChange}
            placeholder={user?.role === "siswa" ? "Masukkan NIS" : "Masukkan NIP / NIK"}
          />
        </div>

        {/* Instansi */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="instansi">
            Instansi
          </label>
          <input
            id="instansi"
            name="instansi"
            type="text"
            className={styles.formInput}
            value={formData.instansi}
            onChange={handleInputChange}
            placeholder="Nama instansi/sekolah/universitas"
          />
        </div>

        {/* Kelas — hanya untuk siswa */}
        {user?.role === "siswa" && (
          <div className={styles.formField}>
            <label className={styles.formLabel} htmlFor="kelas">
              Kelas
            </label>
            <input
              id="kelas"
              name="kelas"
              type="text"
              className={styles.formInput}
              value={formData.kelas}
              onChange={handleInputChange}
              placeholder="Contoh: XII RPL 1"
            />
          </div>
        )}

        {/* Tombol simpan profil */}
        <div className={styles.formActions}>
          <Button
            variant="primary"
            size="md"
            isLoading={saving}
            onClick={handleSaveProfile}
          >
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </Card>

      {/* ==========================================
          SECTION 2: Ubah Password
          ========================================== */}
      <Card variant="skylearn">
        <div className={styles.formSectionTitle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Key className="h-5 w-5 text-sky" />
            <span>Ubah Password</span>
          </div>
        </div>
        <p className={styles.formSectionDesc}>
          Gunakan password yang kuat dan jangan bagikan ke siapa pun.
        </p>

        {/* Info box */}
        <div className={styles.infoBox}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Password minimal 6 karakter. Gunakan kombinasi huruf dan angka untuk keamanan lebih.</span>
        </div>

        {/* Password Saat Ini */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="currentPassword">
            Password Saat Ini
          </label>
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            className={styles.formInput}
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Masukkan password saat ini"
          />
        </div>

        {/* Password Baru */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="newPassword">
            Password Baru
          </label>
          <input
            id="newPassword"
            name="newPassword"
            type="password"
            className={styles.formInput}
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            placeholder="Minimal 6 karakter"
            minLength={6}
          />
        </div>

        {/* Konfirmasi Password Baru */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="confirmPassword">
            Konfirmasi Password Baru
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            className={styles.formInput}
            value={passwordData.confirmPassword}
            onChange={handlePasswordChange}
            placeholder="Ketik ulang password baru"
          />
        </div>

        {/* Tombol ganti password */}
        <div className={styles.formActions}>
          <Button
            variant="primary"
            size="md"
            isLoading={changingPassword}
            onClick={handleChangePassword}
          >
            <Key className="h-4 w-4" />
            Ganti Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
