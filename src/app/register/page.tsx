"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, GraduationCap, UserCog, CheckCircle, ShieldCheck } from "lucide-react";
import { register, getStudyPrograms } from "./actions";
import { validateEmail } from "@/lib/email-validation";
import { PasswordEye } from "@/components/ui/PasswordEye";
import styles from "@/styles/pages/Register.module.css";

type Role = "siswa" | "pembimbing";

interface StudyProgram {
  id: string;
  nama: string;
  kode: string;
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [identityNumber, setIdentityNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [kelas, setKelas] = useState("");
  const [jurusanId, setJurusanId] = useState("");
  const [instansi, setInstansi] = useState("");
  const [role, setRole] = useState<Role>("siswa");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([]);

  useEffect(() => {
    getStudyPrograms().then((programs) => {
      if (Array.isArray(programs)) setStudyPrograms(programs);
    });
  }, []);

  function handleEmailChange(value: string) {
    setEmail(value);
    if (value) {
      const result = validateEmail(value);
      setEmailWarning(result.valid ? null : (result.error ?? null));
    } else {
      setEmailWarning(null);
    }
  }

  function handleRoleChange(next: Role) {
    setRole(next);
    if (next === "pembimbing") {
      setKelas("");
      setJurusanId("");
      setInstansi("");
    }
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!fullName.trim()) errors.fullName = "Nama lengkap wajib diisi.";
    if (!email.trim()) {
      errors.email = "Email wajib diisi.";
    } else {
      const emailResult = validateEmail(email);
      if (!emailResult.valid) errors.email = emailResult.error ?? "Email tidak valid.";
    }
    if (!identityNumber.trim()) {
      errors.identityNumber = "Nomor Induk (NISN/NIP) wajib diisi.";
    }
    if (!password) {
      errors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      errors.password = "Kata sandi minimal 6 karakter.";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Kata sandi tidak cocok.";
    }
    if (role === "siswa") {
      if (!kelas.trim()) {
        errors.kelas = "Kelas wajib diisi.";
      } else if (!/^\d+$/.test(kelas.trim())) {
        errors.kelas = "Kelas hanya boleh berisi angka.";
      }
      if (!jurusanId) {
        errors.jurusanId = "Program studi wajib dipilih.";
      }
      if (!instansi.trim()) {
        errors.instansi = "Instansi / tempat PKL wajib diisi.";
      }
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await register(
        fullName.trim(),
        email.trim(),
        password,
        role,
        role === "siswa" ? kelas.trim() : undefined,
        identityNumber.trim(),
        role === "siswa" ? instansi.trim() : undefined,
        role === "siswa" ? jurusanId : undefined
      );
      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err?.message || "Terjadi kesalahan. Silakan coba lagi.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className={styles.main}>
        <div className={styles.formSection}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={styles.glassCardSuccess}
          >
            <div className={styles.successSection}>
              <div className={styles.successIconWrapper}>
                <CheckCircle className={styles.successIcon} />
              </div>
              <h2 className={styles.successTitle}>Pendaftaran Berhasil!</h2>
              <p className={styles.successDesc}>
                Akun Anda telah terdaftar. Silakan tunggu persetujuan dari admin sebelum dapat masuk ke sistem.
              </p>
              <Link href="/login" style={{ textDecoration: "none" }}>
                <button type="button" className={styles.submitBtn}>
                  Masuk ke Halaman Login
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>
    );
  }

  const formContent = (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <Image src="/logo.png" alt="Politeknik SSR" width={180} height={54} className={styles.formLogo} priority />
        <h1 className={styles.formTitle}>Buat Akun Baru</h1>
        <p className={styles.formSubtitle}>Daftar untuk mengakses Sistem Absensi PKL Politeknik SSR</p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="fullName">Nama Lengkap</label>
          <input
            id="fullName" type="text" required value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masukkan nama lengkap Anda"
            className={`${styles.input} ${fieldErrors.fullName ? styles.inputError : styles.inputNormal}`}
          />
          {fieldErrors.fullName && <span className={styles.fieldError}>{fieldErrors.fullName}</span>}
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email" type="email" required value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="nama@gmail.com"
              className={`${styles.input} ${fieldErrors.email ? styles.inputError : styles.inputNormal}`}
            />
            {emailWarning && <span className={styles.emailWarning}>{emailWarning}</span>}
            {fieldErrors.email && !emailWarning && <span className={styles.fieldError}>{fieldErrors.email}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="identityNumber">
              {role === "siswa" ? "NISN" : "NIP / NIDN"}
            </label>
            <input
              id="identityNumber" type="text" required value={identityNumber}
              onChange={(e) => setIdentityNumber(e.target.value)}
              placeholder={role === "siswa" ? "Nomor Induk Siswa Nasional" : "Nomor Induk Pegawai"}
              className={`${styles.input} ${fieldErrors.identityNumber ? styles.inputError : styles.inputNormal}`}
            />
            {fieldErrors.identityNumber && <span className={styles.fieldError}>{fieldErrors.identityNumber}</span>}
          </div>
        </div>

        {role === "siswa" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.fieldRow}
          >
            <div className={styles.field}>
              <label className={styles.label} htmlFor="kelas">Kelas</label>
              <input
                id="kelas" type="text" inputMode="numeric" required value={kelas}
                onChange={(e) => setKelas(e.target.value.replace(/\D/g, ""))}
                placeholder="Contoh: 10"
                className={`${styles.input} ${fieldErrors.kelas ? styles.inputError : styles.inputNormal}`}
              />
              {fieldErrors.kelas && <span className={styles.fieldError}>{fieldErrors.kelas}</span>}
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="jurusanId">Program Studi</label>
              <select
                id="jurusanId"
                required
                value={jurusanId}
                onChange={(e) => setJurusanId(e.target.value)}
                className={`${styles.select} ${fieldErrors.jurusanId ? styles.selectError : ""} ${!jurusanId ? styles.selectPlaceholder : ""}`}
              >
                <option value="" disabled>Pilih jurusan</option>
                {studyPrograms.map((sp) => (
                  <option key={sp.id} value={sp.id}>{sp.nama}</option>
                ))}
              </select>
              {fieldErrors.jurusanId && <span className={styles.fieldError}>{fieldErrors.jurusanId}</span>}
            </div>
          </motion.div>
        )}

        {role === "siswa" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={styles.field}
          >
            <label className={styles.label} htmlFor="instansi">Instansi / Tempat PKL</label>
            <input
              id="instansi" type="text" required value={instansi}
              onChange={(e) => setInstansi(e.target.value)}
              placeholder="Nama perusahaan / instansi tempat PKL"
              className={`${styles.input} ${fieldErrors.instansi ? styles.inputError : styles.inputNormal}`}
            />
            {fieldErrors.instansi && <span className={styles.fieldError}>{fieldErrors.instansi}</span>}
          </motion.div>
        )}

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Kata Sandi</label>
            <div className={styles.inputWrapper}>
              <input
                id="password" type={showPassword ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 karakter"
                className={`${styles.input} ${styles.inputPassword} ${fieldErrors.password ? styles.inputError : styles.inputNormal}`}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.toggleBtn}>
                <PasswordEye show={showPassword} />
              </button>
            </div>
            {fieldErrors.password && <span className={styles.fieldError}>{fieldErrors.password}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">Konfirmasi</label>
            <div className={styles.inputWrapper}>
              <input
                id="confirmPassword" type={showConfirmPassword ? "text" : "password"} required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi sandi"
                className={`${styles.input} ${styles.inputPassword} ${fieldErrors.confirmPassword ? styles.inputError : styles.inputNormal}`}
              />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className={styles.toggleBtn}>
                <PasswordEye show={showConfirmPassword} />
              </button>
            </div>
            {fieldErrors.confirmPassword && <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Saya mendaftar sebagai</label>
          <div className={styles.roleGroup}>
            <label className={`${styles.roleOption} ${role === "siswa" ? styles.roleOptionActive : ""}`}>
              <input type="radio" name="role" value="siswa" checked={role === "siswa"} onChange={() => handleRoleChange("siswa")} className={styles.roleInput} />
              <GraduationCap className={styles.roleIcon} />
              <span className={styles.roleName}>Siswa</span>
              <span className={styles.roleDesc}>Peserta PKL</span>
            </label>
            <label className={`${styles.roleOption} ${role === "pembimbing" ? styles.roleOptionActive : ""}`}>
              <input type="radio" name="role" value="pembimbing" checked={role === "pembimbing"} onChange={() => handleRoleChange("pembimbing")} className={styles.roleInput} />
              <UserCog className={styles.roleIcon} />
              <span className={styles.roleName}>Pembimbing</span>
              <span className={styles.roleDesc}>Guru / Pembimbing PKL</span>
            </label>
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={styles.errorBox}>
            <span className="text-lg">!</span>
            {error}
          </motion.p>
        )}

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading && <Loader2 className="h-5 w-5 animate-spin" />}
          {loading ? "Mendaftarkan..." : "Daftar"}
        </button>
      </form>

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Sudah punya akun?{" "}
          <Link href="/login" className={styles.footerLink}>Masuk di sini</Link>
        </p>
      </div>
    </div>
  );

  return (
    <main className={styles.main}>
      <div className={styles.heroSection}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroBlob} aria-hidden="true" />
        <div className={styles.heroFade} aria-hidden="true" />
        <div className={styles.heroContent}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className={styles.heroBadge}>
              <GraduationCap className="w-5 h-5" />
              <span>Politeknik SSR</span>
            </div>
            <h2 className={styles.heroTitle}>Bergabunglah dengan Kami</h2>
            <p className={styles.heroDesc}>
              Daftar sebagai siswa atau pembimbing untuk mulai menggunakan Sistem Informasi Absensi PKL.
            </p>
            <div className={styles.heroFeatures}>
              <div className={styles.heroFeature}>
                <ShieldCheck className="w-5 h-5" />
                <span>Verifikasi Lokasi GPS</span>
              </div>
              <div className={styles.heroFeature}>
                <ShieldCheck className="w-5 h-5" />
                <span>Presensi via QR Code</span>
              </div>
              <div className={styles.heroFeature}>
                <ShieldCheck className="w-5 h-5" />
                <span>Kegiatan Harian & Izin</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className={styles.formSection}>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
          className={styles.glassCard}
        >
          {formContent}
        </motion.div>
      </div>
    </main>
  );
}
