"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Loader2, MapPin, Eye, EyeOff } from "lucide-react";
import { signInWithPassword } from "./actions";
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location";
import { Button } from "@/components/ui/Button";
import styles from "@/styles/pages/Login.module.css";

// Wrapper untuk Geolocation API supaya bisa dipakai dengan async/await
function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

async function checkGeolocationPermission(): Promise<boolean> {
  try {
    const permission = await navigator.permissions.query({ name: "geolocation" });
    if (permission.state === "denied") return false;
    return true;
  } catch {
    return true;
  }
}

// Komponen halaman login utama
export default function LoginPage() {
  const router = useRouter();

  // State untuk form username & password
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // State untuk toggle show/hide password
  const [showPassword, setShowPassword] = useState(false);

  // State untuk menampilkan error jika login gagal
  const [error, setError] = useState<string | null>(null);

  // State untuk loading tombol submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk tahap verifikasi lokasi (setelah login berhasil)
  const [gpsStep, setGpsStep] = useState(false);

  // Handler submit form login
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // 1. Autentikasi dengan Supabase
    const result = await signInWithPassword(username, password);
    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    // 2. Cek apakah admin sudah mengatur lokasi GPS
    const hasLocations = await hasLocationsConfigured();
    if (!hasLocations) {
      router.replace("/"); // Langsung ke dashboard kalau belum ada lokasi
      router.refresh();
      return;
    }

    // 3. Minta izin lokasi untuk verifikasi geofence
    setGpsStep(true);

    // Cek izin lokasi terlebih dahulu
    const hasLocationPermission = await checkGeolocationPermission();
    if (!hasLocationPermission) {
      setError("Izin lokasi ditolak. Harap aktifkan izin lokasi di pengaturan browser Anda.");
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
      const errMsg =
        error?.code === 1
          ? "Izin lokasi ditolak. Harap izinkan akses lokasi di browser Anda."
          : error?.code === 2
            ? "Tidak dapat menemukan lokasi. Pastikan GPS aktif."
            : error?.code === 3
              ? "Waktu pencarian lokasi habis. Coba lagi."
              : "Akses lokasi dibutuhkan untuk login. Izinkan akses lokasi di browser Anda.";
      setError(errMsg);
      setIsSubmitting(false);
      setGpsStep(false);
      return;
    }

    // 4. Selamat datang! Redirect ke dashboard sesuai role
    router.replace("/");
    router.refresh();
  }

  // Render tampilan login dengan Skylearn design
  return (
    // Latar belakang putih + gradient sky-soft di pojok
    <main className={styles.main}>
      <div className={styles.bgGradient} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
        className={styles.card}
      >
        <div className={styles.header}>
          <Image
            src="/logo.png"
            alt="Politeknik SSR"
            width={200}
            height={60}
            className="mb-5"
            priority
          />
          <h1
            style={{ fontFamily: "var(--font-josefin), sans-serif" }}
            className="text-xl font-semibold text-deep sm:text-2xl"
          >
            Selamat Datang di
          </h1>
          <h1
            style={{ fontFamily: "var(--font-josefin), sans-serif" }}
            className="text-lg font-semibold text-deep sm:text-xl"
          >
            Sistem Absensi Politeknik SSR
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            {gpsStep
              ? "Memverifikasi lokasi Anda..."
              : "Silakan masuk menggunakan akun yang sudah terdaftar"}
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
              className={cn(
                styles.input,
                error ? styles.inputError : styles.inputNormal,
                gpsStep && styles.inputDisabled,
              )}
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
                className={cn(
                  styles.input,
                  styles.inputPassword,
                  error ? styles.inputError : styles.inputNormal,
                  gpsStep && styles.inputDisabled,
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={gpsStep}
                className={styles.toggleBtn}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className={styles.errorBox}
            >
              <span className="text-lg">!</span>
              {error}
            </motion.p>
          )}

          {gpsStep && (
            <p className={styles.gpsInfo}>
              <MapPin className={styles.gpsIcon} />
              Browser akan meminta izin lokasi. Izinkan untuk verifikasi area
              kampus.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {gpsStep ? "Memverifikasi Lokasi..." : "Login"}
          </Button>
        </form>

        {/* Tautan ke halaman registrasi untuk user yang belum punya akun */}
        <p className="mt-4 text-center text-sm">
          Belum punya akun?{' '}
          <Link href="/register" className="font-semibold text-sky hover:text-sky-deep underline">
            Daftar di sini
          </Link>
        </p>

        <p className={styles.footer}>
          Hubungi Admin Sekolah Jika Belum Memiliki Akses.
        </p>
      </motion.div>
    </main>
  );
}
