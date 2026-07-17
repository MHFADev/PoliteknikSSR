"use client";

import { useEffect, useState } from "react";
import { QRScanner } from "@/components/qr/QRScanner";
import { Card, CardHeader } from "@/components/ui/Card";
import { MapPin, Loader2, ShieldOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location";
import styles from "@/styles/pages/dashboard/siswa/Absensi.module.css";

type GpsState = "loading" | "granted" | "denied" | "unavailable" | "outside" | "error";

export default function SiswaAbsensiPage() {
  const [gpsState, setGpsState] = useState<GpsState>("loading");
  const [gpsMsg, setGpsMsg] = useState("");
  const [gpsReady, setGpsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const hasLoc = await hasLocationsConfigured();
        if (!hasLoc) {
          if (!cancelled) { setGpsState("unavailable"); setGpsReady(true); }
          return;
        }

        if (typeof window === "undefined" || !navigator.geolocation) {
          if (!cancelled) { setGpsState("unavailable"); setGpsMsg("Geolocation tidak didukung browser ini."); setGpsReady(true); }
          return;
        }

        // Minta izin & posisi otomatis
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            if (cancelled) return;
            const result = await checkLoginLocation(pos.coords.latitude, pos.coords.longitude);
            if (result.allowed) {
              setGpsState("granted");
              setGpsReady(true);
            } else {
              setGpsState("outside");
              setGpsMsg(result.error || "Berada di luar area yang diizinkan.");
            }
          },
          (err) => {
            if (cancelled) return;
            if (err.code === 1) {
              setGpsState("denied");
              setGpsMsg("Izin lokasi ditolak. Izinkan akses lokasi di pengaturan browser.");
            } else if (err.code === 2) {
              setGpsState("error");
              setGpsMsg("Tidak dapat menemukan lokasi. Pastikan GPS aktif.");
            } else if (err.code === 3) {
              setGpsState("error");
              setGpsMsg("Waktu pencarian lokasi habis. Coba refresh halaman.");
            } else {
              setGpsState("error");
              setGpsMsg("Gagal mendapatkan lokasi.");
            }
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
      } catch {
        if (!cancelled) { setGpsState("error"); setGpsReady(true); }
      }
    }
    check();
    return () => { cancelled = true; };
  }, []);

  function renderGpsBanner() {
    switch (gpsState) {
      case "loading":
        return (
          <div className={styles.gpsBanner + " " + styles.gpsLoading}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Memeriksa lokasi...</span>
          </div>
        );
      case "granted":
        return (
          <div className={styles.gpsBanner + " " + styles.gpsSuccess}>
            <CheckCircle2 className="h-4 w-4" />
            <span>Lokasi terverifikasi — Silakan scan QR</span>
          </div>
        );
      case "denied":
        return (
          <div className={styles.gpsBanner + " " + styles.gpsError}>
            <ShieldOff className="h-4 w-4" />
            <span>{gpsMsg}</span>
          </div>
        );
      case "outside":
        return (
          <div className={styles.gpsBanner + " " + styles.gpsError}>
            <MapPin className="h-4 w-4" />
            <span>{gpsMsg}</span>
          </div>
        );
      case "unavailable":
        return (
          <div className={styles.gpsBanner + " " + styles.gpsWarning}>
            <AlertTriangle className="h-4 w-4" />
            <span>Lokasi tidak dikonfigurasi — Scan QR tetap bisa dilakukan</span>
          </div>
        );
      case "error":
        return (
          <div className={styles.gpsBanner + " " + styles.gpsError}>
            <AlertTriangle className="h-4 w-4" />
            <span>{gpsMsg || "Gagal verifikasi lokasi."}</span>
          </div>
        );
    }
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Absensi QR</h1>
        <p>Scan QR yang ditampilkan admin untuk mencatat kehadiran hari ini.</p>
      </div>

      {renderGpsBanner()}

      <Card className={styles.scannerCard}>
        <QRScanner gpsReady={gpsReady} />
      </Card>
    </div>
  );
}
