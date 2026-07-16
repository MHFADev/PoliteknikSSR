"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  MapPin,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Ban,
  X,
} from "lucide-react";
import { signInWithPassword } from "./actions";
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location";
import { PasswordEye } from "@/components/ui/PasswordEye";
import styles from "@/styles/pages/Login.module.css";

const GPS_ENABLED = false;

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
  const [blockedPopup, setBlockedPopup] = useState(false);

  const [currentSlide, setCurrentSlide] = useState(0);
  const hasMultipleSlides = HERO_SLIDES.length > 1;
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("blocked") === "true") {
      setBlockedPopup(true);
      window.history.replaceState({}, "", "/login");
    }
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

  const hasAnyImage = HERO_SLIDES.some((_, i) => !imageErrors[i]); /* unused — keep for carousel reactivation */

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signInWithPassword(username, password);
    if (result.error) {
      if (result.error === "AKUN_DIBLOKIR") {
        setBlockedPopup(true);
        setIsSubmitting(false);
        return;
      }
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

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label className={styles.label}>Username</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    value={username}
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
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className={`${styles.input} ${styles.inputWithIcon} ${styles.inputPassword} ${error ? styles.inputError : styles.inputNormal}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.toggleBtn}
                  >
                    <PasswordEye show={showPassword} />
                  </button>
                </div>
              </div>

              <a href="#" className={styles.forgotLink}>
                Lupa kata sandi?
              </a>

              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={styles.errorBox}
                >
                  {error}
                </motion.p>
              )}

              {GPS_ENABLED && gpsStep && (
                <p className={styles.gpsInfo}>
                  <MapPin className={styles.gpsIcon} />
                  Browser akan meminta izin lokasi. Izinkan untuk verifikasi
                  area kampus.
                </p>
              )}

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className={styles.btnSpinner} />
                ) : (
                  <ArrowRight className={styles.btnIcon} />
                )}
                <span>Masuk</span>
              </button>
            </form>

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
    </main>

      <AnimatePresence>
        {blockedPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
            onClick={() => setBlockedPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Ban className="w-7 h-7 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">
                Akun Anda Telah Diblokir
              </h2>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Akun Anda telah diblokir oleh admin. Silakan hubungi admin
                untuk informasi lebih lanjut.
              </p>
              <button
                onClick={() => setBlockedPopup(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Mengerti
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
  </>
  );
}
