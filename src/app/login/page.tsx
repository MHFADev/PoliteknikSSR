"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Loader2,
  MapPin,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { signInWithPassword, requestPasswordReset } from "./actions";
import { signInWithGoogle } from "@/actions/auth";
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location";
import { PasswordEye } from "@/components/ui/PasswordEye";
import styles from "@/styles/pages/Login.module.css";

const GPS_ENABLED = true;

const HERO_SLIDES = [
  { src: "/hero/1.jpg", alt: "Politeknik SSR" },
];

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject({
        code: 1,
        message:
          "Geolocation tidak didukung atau diblokir karena koneksi HTTP tidak aman.",
      });
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
  });
}

function getLocationPermissionState(): Promise<
  "granted" | "denied" | "prompt" | "unsupported"
> {
  try {
    if (
      typeof window === "undefined" ||
      !navigator.permissions ||
      !navigator.permissions.query
    ) {
      return Promise.resolve("unsupported" as const);
    }
    const result = navigator.permissions.query({ name: "geolocation" });
    return result
      .then((s) => s.state as "granted" | "denied" | "prompt")
      .catch(() => "unsupported" as const);
  } catch {
    return Promise.resolve("unsupported" as const);
  }
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsStep, setGpsStep] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const hasMultipleSlides = HERO_SLIDES.length > 1;
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

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

  const hasAnyImage = HERO_SLIDES.some((_, i) => !imageErrors[i]); /* unused — keep for carousel reactivation */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signInWithPassword(username, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    if (GPS_ENABLED) {
      const hasLocations = await hasLocationsConfigured();
      if (!hasLocations) {
        router.replace("/");
        router.refresh();
        return;
      }

      setGpsStep(true);

      const locState = await getLocationPermissionState();
      if (locState === "denied") {
        setError(
          "Izin lokasi ditolak permanen. Buka pengaturan browser > izinkan akses lokasi, lalu reload.",
        );
        setIsSubmitting(false);
        setGpsStep(false);
        return;
      }

      try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        const locationResult = await checkLoginLocation(latitude, longitude);
        if (!locationResult.allowed) {
          setError(locationResult.error || "Akses ditolak.");
          setIsSubmitting(false);
          setGpsStep(false);
          return;
        }
      } catch (error: any) {
        const code = error?.code;
        let errMsg: string;

        if (code === 1) {
          const currentLocState = await getLocationPermissionState();
          if (currentLocState === "denied") {
            errMsg =
              "Izin lokasi ditolak permanen. Buka pengaturan browser > izinkan akses lokasi, lalu reload.";
          } else {
            errMsg =
              "Izin lokasi ditolak atau diblokir browser (HTTP). Jika Anda mengakses via IP local (bukan localhost), browser memblokir sensor lokasi. Silakan gunakan HTTPS atau akses via http://localhost:3000.";
          }
        } else if (code === 2) {
          errMsg =
            "Tidak dapat menemukan lokasi. Pastikan GPS dan koneksi internet aktif.";
        } else if (code === 3) {
          errMsg =
            "Waktu pencarian lokasi habis. Pastikan GPS aktif, lalu coba lagi.";
        } else {
          errMsg =
            "Gagal mendapatkan lokasi. Pastikan menggunakan HTTPS atau localhost, lalu izinkan akses lokasi.";
        }

        setError(errMsg);
        setIsSubmitting(false);
        setGpsStep(false);
        return;
      }
    }

    router.replace("/");
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setGoogleLoading(false);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <>
    <main className={styles.main}>
      {/* ═══ Hero Panel (Left) ════════════════════════════ */}
      <div className={styles.heroSection}>
        {/* Decorative orbs */}
        <div className={`${styles.heroOrb} ${styles.heroOrb1}`} />
        <div className={`${styles.heroOrb} ${styles.heroOrb2}`} />

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
            {hasMultipleSlides && (
              <>
                <button type="button" onClick={prevSlide} className={styles.heroCarouselBtn} aria-label="Sebelumnya">
                  <ChevronLeft />
                </button>
                <button type="button" onClick={nextSlide} className={styles.heroCarouselBtn} aria-label="Selanjutnya">
                  <ChevronRight />
                </button>
              </>
            )}
          </div>

          {/* Dots */}
          {hasMultipleSlides && (
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
          )}
        </div>

        {/* Content over carousel */}
        <div className={styles.heroContent}>
          <div className={styles.heroLogo}>
            <Image
              src="/logo.png"
              alt="Politeknik SSR"
              width={210}
              height={66}
              priority
            />
          </div>
        </div>
        <div className={styles.heroBottom}>
          <h2 className={styles.heroTitle}>
            Sistem Informasi{" "}
            <span className={styles.heroTitleAccent}>Absensi PKL</span>
          </h2>
          <p className={styles.heroDesc}>
            Platform digital untuk memantau kehadiran, kegiatan harian, dan
            pengajuan izin siswa PKL secara real-time.
          </p>
          <div className={styles.heroFeatures}>
            <div className={styles.heroFeature}>
              <div className={styles.heroFeatureIcon}>
                <ShieldCheck />
              </div>
              <span>Presensi via QR Code</span>
            </div>
            <div className={styles.heroFeature}>
              <div className={styles.heroFeatureIcon}>
                <ShieldCheck />
              </div>
              <span>Laporan Real-time</span>
            </div>
          </div>
        </div>

        {/* Glass Divider */}
        <div className={styles.glassDivider}>
          <div className={styles.glassDividerInner} />
        </div>
      </div>

      {/* ═══ Form Panel (Right) ═══════════════════════════ */}
      <div className={styles.formSection}>
        {/* Subtle background decoration */}
        <div className={styles.formBgDecoration}>
          <div className={styles.formBgGrid} />
          <div className={styles.formBgGlow} />
          <div className={styles.formBgGlow2} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={styles.formCard}
        >
          <div className={styles.formContainer}>
            {/* Accent line */}
            <div className={styles.formAccentLine} />

            {/* Mobile logo */}
            <div className={styles.formLogoMobile}>
              <Image
                src="/logo.png"
                alt="Politeknik SSR"
                width={210}
                height={66}
                priority
              />
            </div>

            <div className={styles.formHeader}>
              <h1 className={styles.formTitle}>Selamat Datang di Web Absensi PKL Politeknik SSR</h1>
              <p className={styles.formSubtitle}>
                Silakan masuk ke akun anda
              </p>
            </div>

            {forgotMode ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setError(null);
                  setResetMsg(null);
                  setIsSubmitting(true);
                  const result = await requestPasswordReset(resetEmail);
                  if (result.error) {
                    setError(result.error);
                  } else {
                    setResetMsg(result.message || "Cek email Anda untuk link reset password.");
                  }
                  setIsSubmitting(false);
                }}
                className={styles.form}
              >
                <div className={styles.field}>
                  <label className={styles.label}>Email</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} />
                    <input
                      type="email" required value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="nama@sekolah.ac.id"
                      className={`${styles.input} ${styles.inputWithIcon} ${error ? styles.inputError : styles.inputNormal}`}
                    />
                  </div>
                </div>

                <a href="#" onClick={(e) => { e.preventDefault(); setForgotMode(false); setError(null); setResetMsg(null); }} className={styles.forgotLink}>
                  Kembali ke login
                </a>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={styles.errorBox}>
                    {error}
                  </motion.p>
                )}
                {resetMsg && (
                  <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={styles.successBox}>
                    {resetMsg}
                  </motion.p>
                )}

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className={styles.btnSpinner} /> : <ArrowRight className={styles.btnIcon} />}
                  <span>Kirim Link Reset</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label className={styles.label}>Username</label>
                  <div className={styles.inputWrapper}>
                    <Mail className={styles.inputIcon} />
                    <input
                      type="text" required value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="nama@sekolah.ac.id"
                      className={`${styles.input} ${styles.inputWithIcon} ${error ? styles.inputError : styles.inputNormal}`}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.label}>Kata Sandi</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} />
                    <input
                      type={showPassword ? "text" : "password"} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className={`${styles.input} ${styles.inputWithIcon} ${styles.inputPassword} ${error ? styles.inputError : styles.inputNormal}`}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className={styles.toggleBtn}>
                      <PasswordEye show={showPassword} />
                    </button>
                  </div>
                </div>

                <a href="#" onClick={(e) => { e.preventDefault(); setForgotMode(true); setError(null); }} className={styles.forgotLink}>
                  Lupa kata sandi?
                </a>

                {error && (
                  <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={styles.errorBox}>
                    {error}
                  </motion.p>
                )}

                {GPS_ENABLED && gpsStep && (
                  <p className={styles.gpsInfo}>
                    <MapPin className={styles.gpsIcon} />
                    Browser akan meminta izin lokasi. Izinkan untuk verifikasi area kampus.
                  </p>
                )}

                <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className={styles.btnSpinner} /> : <ArrowRight className={styles.btnIcon} />}
                  <span>Masuk</span>
                </button>

                <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "16px 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--color-outline)" }} />
                  <span style={{ fontSize: "0.75rem", color: "var(--color-ink-subtle)", fontWeight: 500 }}>atau</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--color-outline)" }} />
                </div>

                <button type="button" onClick={handleGoogleSignIn} disabled={googleLoading}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                    padding: "10px 16px", borderRadius: "12px", border: "1px solid var(--color-outline)",
                    background: "var(--bg-card)", fontSize: "0.875rem", fontWeight: 600, color: "var(--color-ink)",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  )}
                  {googleLoading ? "Memproses..." : "Lanjutkan dengan Google"}
                </button>
              </form>
            )}

            <p className={styles.footerText}>
              Belum punya akun?{" "}
              <Link href="/register" className={styles.footerLink}>
                Daftar di sini
              </Link>
            </p>
            <p className={styles.footerSub}>
              Akun dibuat oleh Admin / Pembimbing PKL. Hubungi Admin / Pembimbing PKL jika belum punya akun.
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
