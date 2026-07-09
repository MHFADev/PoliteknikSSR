"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, MapPin } from "lucide-react";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gpsStep, setGpsStep] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signInWithPassword(email, password);

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
      setError("Akses lokasi dibutuhkan untuk login. Izinkan akses lokasi di browser Anda.");
      setIsSubmitting(false);
      setGpsStep(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-deep/5 via-white to-ocean/10" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-[30rem] w-[30rem] rounded-full bg-deep/[0.03] blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-sm rounded-xl2 border border-deep/10 bg-white shadow-glass-lg p-8"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="Politeknik SSR" width={160} height={48} className="mb-4 h-auto w-auto" priority />
          <p className="text-sm text-steel">
            {gpsStep ? "Memverifikasi lokasi Anda..." : "Masuk untuk mengakses dashboard PKL"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-deep">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@sekolah.ac.id"
              disabled={gpsStep}
              className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-deep">Kata Sandi</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={gpsStep}
              className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean disabled:opacity-50"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          {gpsStep && (
            <p className="text-xs text-mist-dim flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Browser akan meminta izin lokasi. Izinkan untuk verifikasi area kampus.
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {gpsStep ? "Memverifikasi Lokasi..." : "Masuk"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-mist-dim">
          Akun dibuat oleh Admin. Hubungi admin sekolah jika belum punya akses.
        </p>
      </motion.div>
    </main>
  );
}
