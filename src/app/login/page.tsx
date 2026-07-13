"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MapPin, GraduationCap, ShieldCheck } from "lucide-react";
import { signInWithPassword } from "./actions";
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location";
import { Button } from "@/components/ui/Button";
import { PasswordEye } from "@/components/ui/PasswordEye";
import styles from "@/styles/pages/Login.module.css";

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      reject({
        code: 1,
        message: "Geolocation tidak didukung atau diblokir karena koneksi HTTP tidak aman."
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

function getLocationPermissionState(): Promise<"granted" | "denied" | "prompt" | "unsupported"> {
  try {
    if (typeof window === "undefined" || !navigator.permissions || !navigator.permissions.query) {
      return Promise.resolve("unsupported" as const);
    }
    const result = navigator.permissions.query({ name: "geolocation" });
    return result.then((s) => s.state as "granted" | "denied" | "prompt").catch(() => "unsupported" as const);
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

    const hasLocations = await hasLocationsConfigured();
    if (!hasLocations) {
      router.replace("/");
      router.refresh();
      return;
    }

    setGpsStep(true);

    // Cek apakah lokasi sudah pernah ditolak (browser remember decision)
    const locState = await getLocationPermissionState();
    if (locState === "denied") {
      setError("Izin lokasi ditolak permanen. Buka pengaturan browser > izinkan akses lokasi, lalu reload.");
      setIsSubmitting(false);
      setGpsStep(false);
      return;
    }

    // getCurrentPosition akan trigger browser prompt (jika belum pernah di-allow/deny)
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
          errMsg = "Izin lokasi ditolak permanen. Buka pengaturan browser > izinkan akses lokasi, lalu reload.";
        } else {
          errMsg = "Izin lokasi ditolak atau diblokir browser (HTTP). Jika Anda mengakses via IP local (bukan localhost), browser memblokir sensor lokasi. Silakan gunakan HTTPS atau akses via http://localhost:3000.";
        }
      } else if (code === 2) {
        errMsg = "Tidak dapat menemukan lokasi. Pastikan GPS dan koneksi internet aktif.";
      } else if (code === 3) {
        errMsg = "Waktu pencarian lokasi habis. Pastikan GPS aktif, lalu coba lagi.";
      } else {
        errMsg = "Gagal mendapatkan lokasi. Pastikan menggunakan HTTPS atau localhost, lalu izinkan akses lokasi.";
      }

      setError(errMsg);
      setIsSubmitting(false);
      setGpsStep(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  const formContent = (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <Image src="/logo.png" alt="Politeknik SSR" width={180} height={54} className={styles.formLogo} priority />
        <h1 className={styles.formTitle}>Selamat Datang</h1>
        <p className={styles.formSubtitle}>
          {gpsStep ? "Memverifikasi lokasi Anda..." : "Masuk ke akun Anda"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Username</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="nama@sekolah.ac.id"
            disabled={gpsStep}
            className={`${styles.input} ${error ? styles.inputError : styles.inputNormal} ${gpsStep ? styles.inputDisabled : ""}`}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Kata Sandi</label>
          <div className={styles.inputWrapper}>
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={gpsStep}
              className={`${styles.input} ${styles.inputPassword} ${error ? styles.inputError : styles.inputNormal} ${gpsStep ? styles.inputDisabled : ""}`}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} disabled={gpsStep} className={styles.toggleBtn}>
              <PasswordEye show={showPassword} />
            </button>
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={styles.errorBox}>
            <span className="text-lg">!</span>
            {error}
          </motion.p>
        )}

        {gpsStep && (
          <p className={styles.gpsInfo}>
            <MapPin className={styles.gpsIcon} />
            Browser akan meminta izin lokasi. Izinkan untuk verifikasi area kampus.
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {gpsStep ? "Memverifikasi Lokasi..." : "Login"}
        </Button>
      </form>

      <p className={styles.footerText}>
        Belum punya akun?{" "}
        <Link href="/register" className={styles.footerLink}>Daftar di sini</Link>
      </p>
      <p className={styles.footerSub}>Hubungi Admin Sekolah Jika Belum Memiliki Akses.</p>
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
            <h2 className={styles.heroTitle}>Sistem Informasi Absensi PKL</h2>
            <p className={styles.heroDesc}>
              Platform digital untuk memantau kehadiran, kegiatan harian, dan pengajuan izin siswa PKL secara real-time.
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
                <span>Laporan Real-time</span>
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