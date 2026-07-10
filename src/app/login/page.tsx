"use client";

import { cn } from "@/lib/utils"; // Fungsi merge Tailwind classes
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion"; // Animasi halus
import { Loader2, MapPin, Eye, EyeOff } from "lucide-react";
import { signInWithPassword } from "./actions"; // Server action auth
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location"; // Server actions lokasi
import { Button } from "@/components/ui/Button"; // Komponen tombol utama

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
    } catch {
      setError(
        "Akses lokasi dibutuhkan untuk login. Izinkan akses lokasi di browser Anda.",
      );
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-soft/80 via-white to-sky-soft/40" />

      {/* Kartu login dengan animasi masuk (spring easing) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }} // Spring easing
        className="relative w-full max-w-sm rounded-skylearn-xl border border-outline bg-white p-8 shadow-skylearn"
      >
        {/* Header: Logo & judul */}
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Politeknik SSR"
            width={160}
            height={48}
            className="mb-5"
            priority
          />
          <h1 className="font-display text-2xl font-bold text-ink">Selamat Datang Di</h1>
          <h1 className="font-display text-2xl font-bold text-ink">Sistem Absensi Politeknik SSR</h1>
          <p className="mt-2 text-base text-ink-muted">
            {gpsStep ? "Memverifikasi lokasi Anda..." : "Silakan masuk menggunakan akun yang sudah terdaftar"}
          </p>
        </div>

        {/* Form login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input username */}
          <div>
            <label className="text-base font-semibold text-ink">Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="nama@sekolah.ac.id"
              disabled={gpsStep}
              className={cn(
                "mt-1.5 w-full rounded-skylearn-md border bg-white px-4 py-3 text-lg outline-none transition-shadow duration-200 focus:border-sky focus:ring-4 focus:ring-sky-soft disabled:opacity-50",
                error ? "border-coral bg-coral-soft/30" : "border-outline",
              )}
            />
          </div>

          {/* Input password dengan toggle show/hide */}
          <div>
            <label className="text-base font-semibold text-ink">Kata Sandi</label>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={gpsStep}
                className={cn(
                  "w-full rounded-skylearn-md border bg-white px-4 py-3 pr-12 text-lg outline-none transition-shadow duration-200 focus:border-sky focus:ring-4 focus:ring-sky-soft disabled:opacity-50",
                  error ? "border-coral bg-coral-soft/30" : "border-outline",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={gpsStep}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink-subtle hover:text-ink transition-colors disabled:opacity-50"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Pesan error (jika ada) */}
          {error && (
            <motion.p
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 rounded-skylearn-md bg-coral-soft px-4 py-3 text-base text-coral"
            >
              <span className="text-lg">!</span>
              {error}
            </motion.p>
          )}

          {/* Pesan info GPS */}
          {gpsStep && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <MapPin className="h-4 w-4 shrink-0 text-sky" />
              Browser akan meminta izin lokasi. Izinkan untuk verifikasi area kampus.
            </p>
          )}

          {/* Tombol submit */}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
            {gpsStep ? "Memverifikasi Lokasi..." : "Login"}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-ink-subtle">
          Hubungi Admin Sekolah Jika Belum Memiliki Akses.
        </p>
      </motion.div>
    </main>
  );
}