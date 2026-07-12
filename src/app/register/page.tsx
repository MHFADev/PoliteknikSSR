"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, UserPlus, GraduationCap, UserCog, Eye, EyeOff, CheckCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { register } from "./actions";
import { validateEmail } from "@/lib/email-validation";
import styles from "@/styles/pages/Register.module.css";

type Role = "siswa" | "pembimbing";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<Role>("siswa");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [emailWarning, setEmailWarning] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleEmailChange(value: string) {
    setEmail(value);
    if (value) {
      const result = validateEmail(value);
      setEmailWarning(result.valid ? null : (result.error ?? null));
    } else {
      setEmailWarning(null);
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
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateForm()) return;
    setLoading(true);
    const result = await register(fullName.trim(), email.trim(), password, role);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
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
              <Link href="/login">
                <Button variant="primary" size="lg">
                  Masuk ke Halaman Login
                </Button>
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
        <Image src="/logo.png" alt="Politeknik SSR" width={140} height={42} className={styles.formLogo} priority />
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
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {fieldErrors.confirmPassword && <span className={styles.fieldError}>{fieldErrors.confirmPassword}</span>}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Saya mendaftar sebagai</label>
          <div className={styles.roleGroup}>
            <label className={`${styles.roleOption} ${role === "siswa" ? styles.roleOptionActive : ""}`}>
              <input type="radio" name="role" value="siswa" checked={role === "siswa"} onChange={() => setRole("siswa")} className={styles.roleInput} />
              <GraduationCap className={styles.roleIcon} />
              <span className={styles.roleName}>Siswa</span>
              <span className={styles.roleDesc}>Peserta PKL</span>
            </label>
            <label className={`${styles.roleOption} ${role === "pembimbing" ? styles.roleOptionActive : ""}`}>
              <input type="radio" name="role" value="pembimbing" checked={role === "pembimbing"} onChange={() => setRole("pembimbing")} className={styles.roleInput} />
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

        <Button type="submit" variant="primary" size="lg" isLoading={loading} className={styles.submitBtn}>
          {loading ? "Mendaftarkan..." : "Daftar"}
        </Button>
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
      {/* Desktop Hero Section */}
      <div className={styles.heroSection}>
        <div className={styles.heroOverlay} />
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

      {/* Form Section */}
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