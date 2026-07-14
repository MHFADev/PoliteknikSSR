"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Loader2,
  GraduationCap,
  UserCog,
  CheckCircle,
  ShieldCheck,
  User,
  Mail,
  Hash,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

const HERO_SLIDES = [
  { src: "/hero/1.jpg", alt: "Kampus Politeknik SSR" },
  { src: "/hero/2.jpg", alt: "Kegiatan PKL Siswa" },
  { src: "/hero/3.jpg", alt: "Laboratorium Komputer" },
];
/* Ganti ekstensi sesuai format gambar: .jpg, .png, .webp, dll */

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
  const [agreed, setAgreed] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getStudyPrograms().then((programs) => {
      if (Array.isArray(programs)) setStudyPrograms(programs);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = useCallback((idx: number) => {
    setCurrentSlide(idx);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) =>
      prev === 0 ? HERO_SLIDES.length - 1 : prev - 1
    );
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  function handleImageError(idx: number) {
    setImageErrors((prev) => ({ ...prev, [idx]: true }));
  }

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
      if (!emailResult.valid)
        errors.email = emailResult.error ?? "Email tidak valid.";
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
    if (!agreed) {
      errors.agreed = "Anda harus menyetujui Syarat & Ketentuan.";
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
        role === "siswa" ? jurusanId : undefined,
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
            className={styles.formCard}
          >
            <div className={styles.successSection}>
              <div className={styles.successIconWrapper}>
                <CheckCircle className={styles.successIcon} />
              </div>
              <h2 className={styles.successTitle}>Pendaftaran Berhasil!</h2>
              <p className={styles.successDesc}>
                Akun Anda telah terdaftar. Silakan tunggu persetujuan dari admin
                sebelum dapat masuk ke sistem.
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

  return (
    <main className={styles.main}>
      {/* ─── Hero Panel (Left) ──────────────────────────── */}
      <div className={styles.heroSection}>
        {/* Image Carousel */}
        <div className={styles.heroCarousel}>
          {HERO_SLIDES.map((slide, idx) => (
            <div
              key={idx}
              className={`${styles.heroSlide} ${idx === currentSlide ? styles.heroSlideActive : ""}`}
            >
              {!imageErrors[idx] ? (
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  className={styles.heroSlideImg}
                  onError={() => handleImageError(idx)}
                  priority={idx === 0}
                  sizes="48vw"
                />
              ) : (
                <div className={styles.heroSlideFallback} />
              )}
            </div>
          ))}
          <div className={styles.heroCarouselOverlay} />

          {/* Carousel Controls */}
          <div className={styles.heroCarouselControls}>
            <button
              type="button"
              onClick={prevSlide}
              className={styles.heroCarouselBtn}
              aria-label="Sebelumnya"
            >
              <ChevronLeft />
            </button>
            <button
              type="button"
              onClick={nextSlide}
              className={styles.heroCarouselBtn}
              aria-label="Selanjutnya"
            >
              <ChevronRight />
            </button>
          </div>

          {/* Dots */}
          <div className={styles.heroDots}>
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => goToSlide(idx)}
                className={`${styles.heroDot} ${idx === currentSlide ? styles.heroDotActive : ""}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content over carousel */}
        <div className={styles.heroContent}>
          <div className={styles.heroLogo}>
            <Image
              src="/logo.png"
              alt="Politeknik SSR"
              width={140}
              height={44}
              priority
            />
          </div>
        </div>
        <div className={styles.heroBottom}>
          <h2 className={styles.heroTitle}>
            Bergabunglah<br />dengan Kami
          </h2>
          <p className={styles.heroDesc}>
            Daftar sebagai siswa atau pembimbing untuk mulai menggunakan
            Sistem Informasi Absensi PKL.
          </p>
          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}>
              <ShieldCheck />
              <span>Presensi via QR Code</span>
            </div>
            <div className={styles.heroFeature}>
              <ShieldCheck />
              <span>Kegiatan Harian & Izin</span>
            </div>
          </div>
        </div>

        {/* Glass Divider */}
        <div className={styles.glassDivider} />
      </div>

      {/* ─── Form Panel (Right) ─────────────────────────── */}
      <div className={styles.formSection}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={styles.formCard}
        >
          <div className={styles.formContainer}>
            {/* Mobile logo */}
            <div className={styles.formLogoMobile}>
              <Image
                src="/logo.png"
                alt="Politeknik SSR"
                width={140}
                height={44}
                priority
              />
            </div>

            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Buat Akun Baru</h1>
              <p className={styles.formSubtitle}>
                Sudah punya akun?{" "}
                <Link href="/login">Masuk di sini</Link>
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="fullName">
                  Nama Lengkap
                </label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} />
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                    className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.fullName ? styles.inputError : styles.inputNormal}`}
                  />
                </div>
                {fieldErrors.fullName && (
                  <span className={styles.fieldError}>
                    {fieldErrors.fullName}
                  </span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Email
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="nama@gmail.com"
                    className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.email ? styles.inputError : styles.inputNormal}`}
                  />
                </div>
                {emailWarning && (
                  <span className={styles.emailWarning}>{emailWarning}</span>
                )}
                {fieldErrors.email && !emailWarning && (
                  <span className={styles.fieldError}>{fieldErrors.email}</span>
                )}
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="identityNumber">
                  {role === "siswa" ? "NISN" : "NIP / NIDN"}
                </label>
                <div className={styles.inputWrapper}>
                  <Hash className={styles.inputIcon} />
                  <input
                    id="identityNumber"
                    type="text"
                    required
                    value={identityNumber}
                    onChange={(e) => setIdentityNumber(e.target.value)}
                    placeholder={
                      role === "siswa"
                        ? "Nomor Induk Siswa Nasional"
                        : "Nomor Induk Pegawai"
                    }
                    className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.identityNumber ? styles.inputError : styles.inputNormal}`}
                  />
                </div>
                {fieldErrors.identityNumber && (
                  <span className={styles.fieldError}>
                    {fieldErrors.identityNumber}
                  </span>
                )}
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label} htmlFor="password">
                    Kata Sandi
                  </label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className={`${styles.input} ${styles.inputWithIcon} ${styles.inputPassword} ${fieldErrors.password ? styles.inputError : styles.inputNormal}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={styles.toggleBtn}
                    >
                      <PasswordEye show={showPassword} />
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <span className={styles.fieldError}>
                      {fieldErrors.password}
                    </span>
                  )}
                </div>

                <div className={styles.field}>
                  <label className={styles.label} htmlFor="confirmPassword">
                    Konfirmasi
                  </label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi sandi"
                      className={`${styles.input} ${styles.inputWithIcon} ${styles.inputPassword} ${fieldErrors.confirmPassword ? styles.inputError : styles.inputNormal}`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className={styles.toggleBtn}
                    >
                      <PasswordEye show={showConfirmPassword} />
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <span className={styles.fieldError}>
                      {fieldErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Saya mendaftar sebagai</label>
                <div className={styles.roleGroup}>
                  <label
                    className={`${styles.roleOption} ${role === "siswa" ? styles.roleOptionActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="siswa"
                      checked={role === "siswa"}
                      onChange={() => handleRoleChange("siswa")}
                      className={styles.roleInput}
                    />
                    <GraduationCap className={styles.roleIcon} />
                    <span className={styles.roleName}>Siswa</span>
                    <span className={styles.roleDesc}>Peserta PKL</span>
                  </label>
                  <label
                    className={`${styles.roleOption} ${role === "pembimbing" ? styles.roleOptionActive : ""}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value="pembimbing"
                      checked={role === "pembimbing"}
                      onChange={() => handleRoleChange("pembimbing")}
                      className={styles.roleInput}
                    />
                    <UserCog className={styles.roleIcon} />
                    <span className={styles.roleName}>Pembimbing</span>
                    <span className={styles.roleDesc}>Guru / Pembimbing PKL</span>
                  </label>
                </div>
              </div>

              {role === "siswa" && (
                <>
                  <div className={styles.fieldRow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="kelas">
                        Kelas
                      </label>
                      <div className={styles.inputWrapper}>
                        <Hash className={styles.inputIcon} />
                        <input
                          id="kelas"
                          type="text"
                          inputMode="numeric"
                          required
                          value={kelas}
                          onChange={(e) =>
                            setKelas(e.target.value.replace(/\D/g, ""))
                          }
                          placeholder="Contoh: 10"
                          className={`${styles.input} ${styles.inputWithIcon} ${fieldErrors.kelas ? styles.inputError : styles.inputNormal}`}
                        />
                      </div>
                      {fieldErrors.kelas && (
                        <span className={styles.fieldError}>
                          {fieldErrors.kelas}
                        </span>
                      )}
                    </div>

                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="jurusanId">
                        Program Studi
                      </label>
                      <select
                        id="jurusanId"
                        required
                        value={jurusanId}
                        onChange={(e) => setJurusanId(e.target.value)}
                        className={`${styles.select} ${fieldErrors.jurusanId ? styles.selectError : ""} ${!jurusanId ? styles.selectPlaceholder : ""}`}
                      >
                        <option value="" disabled>
                          Pilih jurusan
                        </option>
                        {studyPrograms.map((sp) => (
                          <option key={sp.id} value={sp.id}>
                            {sp.nama}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.jurusanId && (
                        <span className={styles.fieldError}>
                          {fieldErrors.jurusanId}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="instansi">
                      Instansi / Tempat PKL
                    </label>
                    <input
                      id="instansi"
                      type="text"
                      required
                      value={instansi}
                      onChange={(e) => setInstansi(e.target.value)}
                      placeholder="Nama perusahaan / instansi tempat PKL"
                      className={`${styles.input} ${fieldErrors.instansi ? styles.inputError : styles.inputNormal}`}
                    />
                    {fieldErrors.instansi && (
                      <span className={styles.fieldError}>
                        {fieldErrors.instansi}
                      </span>
                    )}
                  </div>
                </>
              )}

              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="terms" className={styles.checkboxLabel}>
                  Saya menyetujui{" "}
                  <a href="#">Syarat & Ketentuan</a> yang berlaku
                </label>
              </div>
              {fieldErrors.agreed && (
                <span className={styles.fieldError}>{fieldErrors.agreed}</span>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={styles.errorBox}
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
              >
                {loading ? (
                  <Loader2 className={styles.btnSpinner} />
                ) : (
                  <ArrowRight className={styles.btnIcon} />
                )}
                <span>{loading ? "Mendaftarkan..." : "Buat Akun"}</span>
              </button>
            </form>

            <div className={styles.footer}>
              <p className={styles.footerText}>
                Sudah punya akun?{" "}
                <Link href="/login" className={styles.footerLink}>
                  Masuk di sini
                </Link>
              </p>
              <p className={styles.footerSub}>
                Hubungi Admin Jika Belum Memiliki Akses.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
