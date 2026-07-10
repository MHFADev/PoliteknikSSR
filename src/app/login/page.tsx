"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, MapPin, Eye, EyeOff } from "lucide-react";
import { signInWithPassword } from "./actions";
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location";
import { Button } from "@/components/ui/Button";

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
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

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sky-soft/80 via-white to-sky-soft/40" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative w-full max-w-sm rounded-skylearn-xl border border-outline bg-white p-8 shadow-skylearn"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Image
            src="/logo.png"
            alt="Politeknik SSR"
            width={160}
            height={48}
            className="mb-5 h-auto w-auto"
            priority
          />
          <h1 className="font-display text-2xl font-bold text-ink">
            Selamat Datang Di
          </h1>
          <h1 className="font-display text-2xl font-bold text-ink">
            Sistem Absensi Politeknik SSR
          </h1>
          <p className="mt-2 text-base text-ink-muted">
            {gpsStep
              ? "Memverifikasi lokasi Anda..."
              : "Silakan masuk menggunakan akun yang sudah terdaftar"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
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
                error
                  ? "border-coral bg-coral-soft/30"
                  : "border-outline",
              )}
            />
          </div>
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
                  error
                    ? "border-coral bg-coral-soft/30"
                    : "border-outline",
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={gpsStep}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-ink-subtle hover:text-ink transition-colors disabled:opacity-50"
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
              className="flex items-center gap-2 rounded-skylearn-md bg-coral-soft px-4 py-3 text-base text-coral"
            >
              <span className="text-lg">!</span>
              {error}
            </motion.p>
          )}

          {gpsStep && (
            <p className="flex items-center gap-2 text-sm text-ink-muted">
              <MapPin className="h-4 w-4 shrink-0 text-sky" />
              Browser akan meminta izin lokasi. Izinkan untuk verifikasi area
              kampus.
            </p>
          )}

<<<<<<< HEAD
          <Button
            type="submit"
            className="w-full hover:!from-bg-blue-100 hover:!to-bg-blue-700 !text-white !shadow-lg hover:!shadow-xl !border-0"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
=======
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
>>>>>>> 0200e1df9ba792cd0ab5fa816124e03680896bdd
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