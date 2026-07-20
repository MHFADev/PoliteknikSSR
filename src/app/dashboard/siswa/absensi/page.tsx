"use client";

import { useEffect, useState } from "react";
import { QRScanner } from "@/components/qr/QRScanner";
import { Card, CardHeader } from "@/components/ui/Card";
import { Clock, MapPin, Loader2, ShieldOff, CheckCircle2, AlertTriangle } from "lucide-react";
import { checkLoginLocation, hasLocationsConfigured } from "@/actions/location";
import styles from "@/styles/pages/dashboard/siswa/Absensi.module.css";

const DAYS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function LiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div data-tour="absensi-clock" style={{ textAlign: "center", padding: "0.75rem 1rem", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", borderRadius: "1rem", color: "#fff" }}>
      <div style={{ fontSize: "0.75rem", opacity: 0.6, marginBottom: "0.15rem" }}>
        {DAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]} {now.getFullYear()}
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
        <Clock className="h-5 w-5" style={{ opacity: 0.7 }} />
        <span style={{ fontSize: "2rem", fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "0.05em" }}>
          {String(now.getHours()).padStart(2, "0")}:{String(now.getMinutes()).padStart(2, "0")}:{String(now.getSeconds()).padStart(2, "0")}
        </span>
        <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>WIB</span>
      </div>
    </div>
  );
}

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

      <LiveClock />

      <div data-tour="absensi-gps">{renderGpsBanner()}</div>

      <Card className={styles.scannerCard} data-tour="absensi-scan">
        <QRScanner gpsReady={gpsReady} />
      </Card>
    </div>
  );
}
