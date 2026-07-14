"use client";

// ============================================================
// ProfileForm — Formulir profil yang bisa dipakai semua role
// ============================================================
// Komponen ini menangani:
// 1. Upload & ganti foto profil (dikompres otomatis)
// 2. Mengedit Nama Lengkap, NIS/NIM, Instansi, Kelas
// 3. Mengganti password (dengan verifikasi password lama)
// 4. Menampilkan pesan sukses/error setelah operasi
//
// Alur upload avatar:
// - File dipilih user → dikompres via browser-image-compliance →
// - Upload langsung ke Supabase Storage dari client →
// - Update avatar_url di tabel profiles via server action
//
// State management:
// - user: data user dari server (di-fetch via getProfile action)
// - formData: data form yang sedang diedit (controlled component)
// - loading: status loading saat fetch/save
// - success/error: status notifikasi
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";
import imageCompression from "browser-image-compression";
import { User, Save, Key, Loader2, CheckCircle2, AlertCircle, Camera } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getProfile, updateProfile, changePassword } from "@/actions/profile";
import { createClient } from "@/lib/supabase/client";
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
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  // State untuk avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------
  // Fetch data user saat komponen dimount
  // ----------------------------------------------------------
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getProfile();
      if (profile) {
        setUser(profile);
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

  useEffect(() => { fetchUser(); }, [fetchUser]);

  // ----------------------------------------------------------
  // Handler input change (generic untuk semua field text)
  // ----------------------------------------------------------
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ----------------------------------------------------------
  // Handler simpan profil
  // ----------------------------------------------------------
  const handleSaveProfile = async () => {
    if (!formData.fullName.trim()) {
      setError("Nama Lengkap wajib diisi.");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const result = await updateProfile({
        fullName: formData.fullName,
        identityNumber: formData.identityNumber,
        instansi: formData.instansi,
        kelas: formData.kelas,
      });
      if (result.success) {
        setSuccess("Profil berhasil diperbarui!");
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
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword.length < 6) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("Konfirmasi password tidak sesuai.");
      return;
    }
    if (!passwordData.currentPassword) {
      setError("Password saat ini wajib diisi.");
      return;
    }
    try {
      setChangingPassword(true);
      setError(null);
      setSuccess(null);
      const result = await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (result.success) {
        setSuccess("Password berhasil diubah!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
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
  // Handler avatar upload — Upload langsung dari client
  // Alur: pilih file → kompres → upload ke Supabase Storage →
  //        update avatar_url di database via server action
  // ----------------------------------------------------------
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("Tipe file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF.");
      return;
    }

    // Validasi ukuran (max 5MB sebelum kompresi)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file terlalu besar. Maksimal 5MB.");
      return;
    }

    try {
      setUploadingAvatar(true);
      setError(null);
      setSuccess(null);

      // Langkah 1: Kompres gambar secara agresif agar ukuran kecil
      // Max 150KB, max dimensi 400x400px (avatar tidak perlu besar)
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.15,           // Maks 150KB — sangat kecil
        maxWidthOrHeight: 400,     // Maks 400px — cukup untuk avatar
        useWebWorker: true,
        fileType: "image/jpeg",    // Konversi ke JPEG untuk ukuran lebih kecil
        initialQuality: 0.6,       // Kualitas 60% — kompresi agresif
      });

      // Langkah 2: Upload langsung ke Supabase Storage dari client
      // (Tidak lewat Server Action karena File object tidak bisa dikirim)
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setError("Sesi login tidak ditemukan. Silakan login ulang.");
        return;
      }

      // Hapus avatar lama jika ada
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(authUser.id);

      if (existingFiles && existingFiles.length > 0) {
        const pathsToDelete = existingFiles.map((f) => `${authUser.id}/${f.name}`);
        await supabase.storage.from("avatars").remove(pathsToDelete);
      }

      // Upload avatar baru
      const filePath = `${authUser.id}/avatar.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedFile, {
          upsert: true,
          contentType: "image/jpeg",
        });

      if (uploadError) {
        setError("Gagal upload foto: " + uploadError.message);
        return;
      }

      // Dapatkan public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = urlData.publicUrl;

      // Langkah 3: Update avatar_url di database via server action
      const result = await updateProfile({ avatarUrl });

      if (result.success) {
        setSuccess("Foto profil berhasil diperbarui!");
        setUser((prev) => prev ? { ...prev, avatarUrl } : prev);
        setAvatarPreview(avatarUrl);
      } else {
        setError(result.error || "Gagal menyimpan foto profil.");
      }
    } catch (err) {
      console.error("Error uploading avatar:", err);
      setError("Terjadi kesalahan saat upload foto profil.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ----------------------------------------------------------
  // Helper: dapatkan class badge berdasarkan role
  // ----------------------------------------------------------
  const getBadgeClass = (role: string) => {
    switch (role) {
      case "siswa": return styles.badgeSiswa;
      case "pembimbing": return styles.badgePembimbing;
      case "admin": return styles.badgeAdmin;
      default: return "";
    }
  };

  // ----------------------------------------------------------
  // Helper: URL avatar yang aktif (preview atau dari user)
  // ----------------------------------------------------------
  const currentAvatar = avatarPreview || user?.avatarUrl || null;

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
          SECTION 0: Foto Profil
          - Upload gambar yang dikompres agresif (max 150KB)
          - Preview langsung tanpa refresh halaman
          ========================================== */}
      <Card variant="skylearn">
        <div className={styles.formSectionTitle}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Camera className="h-5 w-5 text-sky" />
            <span>Foto Profil</span>
          </div>
        </div>
        <p className={styles.formSectionDesc}>
          Upload foto profil kamu. Foto akan dikompres otomatis agar ukuran kecil.
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          {/* Avatar Preview — tampilkan foto atau huruf pertama */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "9999px",
              background: currentAvatar ? "transparent" : "#DBEAFE",
              color: "#1D4ED8",
              fontSize: "2rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "3px solid #E2E8F0",
              overflow: "hidden",
            }}
          >
            {currentAvatar ? (
              <img
                src={currentAvatar}
                alt={user?.fullName || "Avatar"}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              user?.fullName?.charAt(0).toUpperCase() || "U"
            )}
          </div>

          {/* Upload Button + info kompresi */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload">
              <Button
                variant="outline"
                size="md"
                isLoading={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                <Camera className="h-4 w-4" />
                {uploadingAvatar ? "Mengkompres & Upload..." : currentAvatar ? "Ganti Foto" : "Upload Foto"}
              </Button>
            </label>
            <p style={{ fontSize: "0.75rem", color: "#94A3B8", marginTop: "0.5rem" }}>
              JPG, PNG, WebP, atau GIF. Akan dikompres ke max 150KB.
            </p>
          </div>
        </div>
      </Card>

      {/* ==========================================
          SECTION 1: Data Profil
          - Form edit nama, NIS/NIP, instansi, kelas
          - Email dan role hanya ditampilkan (readonly)
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

        {/* Nama Lengkap — wajib diisi */}
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

        {/* Email — readonly, dari auth system */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className={styles.formInputDisabled}
            value={user?.email || ""}
            disabled
          />
        </div>

        {/* Role — ditampilkan sebagai badge warna */}
        <div className={styles.formField}>
          <label className={styles.formLabel}>Role</label>
          <div>
            {user?.role && (
              <span className={`${styles.badge} ${getBadgeClass(user.role)}`}>
                {user.role === "siswa" ? "Siswa" : user.role === "pembimbing" ? "Pembimbing" : "Admin"}
              </span>
            )}
          </div>
        </div>

        {/* NIS/NIM — untuk siswa, NIP/NIK untuk pembimbing/admin */}
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

        {/* Instansi — nama tempat PKL/sekolah */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="instansi">Instansi</label>
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
            <label className={styles.formLabel} htmlFor="kelas">Kelas</label>
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
          <Button variant="primary" size="md" isLoading={saving} onClick={handleSaveProfile}>
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>
      </Card>

      {/* ==========================================
          SECTION 2: Ubah Password
          - Verifikasi password lama sebelum ganti
          - Password baru minimal 6 karakter
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

        {/* Info box — tips keamanan */}
        <div className={styles.infoBox}>
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>Password minimal 6 karakter. Gunakan kombinasi huruf dan angka untuk keamanan lebih.</span>
        </div>

        {/* Password Saat Ini — untuk verifikasi */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="currentPassword">Password Saat Ini</label>
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
          <label className={styles.formLabel} htmlFor="newPassword">Password Baru</label>
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

        {/* Konfirmasi Password Baru — harus sama */}
        <div className={styles.formField}>
          <label className={styles.formLabel} htmlFor="confirmPassword">Konfirmasi Password Baru</label>
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
          <Button variant="primary" size="md" isLoading={changingPassword} onClick={handleChangePassword}>
            <Key className="h-4 w-4" />
            Ganti Password
          </Button>
        </div>
      </Card>
    </div>
  );
}
