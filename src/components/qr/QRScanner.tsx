"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  CameraOff,
  Camera,
  RefreshCw,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { submitAttendance } from "@/actions/attendance";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/qr/QRScanner.module.css";

const SCANNER_ELEMENT_ID = "qr-reader-viewport";

type ScanState =
  | "idle"
  | "requesting"
  | "scanning"
  | "processing"
  | "success"
  | "error";

/**
 * QRScanner — Komponen scan QR presensi.
 *
 * Alur izin kamera yang benar (mobile + desktop):
 * 1. User tap tombol "Mulai Scan QR" (user gesture — wajib untuk getUserMedia)
 * 2. Kita panggil navigator.mediaDevices.getUserMedia({ video: true }) untuk
 *    MEMICU PROMPT izin kamera di browser (termasuk mobile Chrome/Safari).
 * 3. Setelah izin diberikan, stream di-stop dan kita hand off ke html5-qrcode
 *    yang akan membuka kamera ulang dengan config optimal.
 * 4. Jika izin ditolak, tampilkan panduan yang jelas per platform.
 *
 * Di mobile (Android Chrome, iOS Safari ≥ 14.3):
 * - WAJIB HTTPS atau localhost untuk akses kamera.
 * - Prompt izin HARUS dipicu dari user gesture (tap).
 * - iOS tidak punya Permissions API, jadi kita tidak pakai permission.query().
 */
export function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState<string>("");
  const [resultData, setResultData] = useState<{ status: string; name: string; time: string } | null>(null);
  const [useFrontCamera, setUseFrontCamera] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Deteksi iOS untuk panduan izin spesifik
    const ua = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));

    return () => {
      stopScanner();
    };
  }, []);

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }
    } catch {
      // ignore
    }
  }

  /**
   * Minta izin kamera secara eksplisit via getUserMedia sebelum memulai scanner.
   * Ini memastikan prompt izin kamera muncul di browser mobile (Android & iOS).
   */
  async function requestCameraPermission(): Promise<boolean> {
    try {
      if (
        typeof window === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        throw {
          name: "InsecureContextError",
          message: "Browser memblokir kamera di HTTP non-localhost",
        };
      }

      const constraints: MediaStreamConstraints = {
        video: useFrontCamera
          ? { facingMode: "user" }
          : { facingMode: { ideal: "environment" } },
        audio: false,
      };

      // Trigger browser permission prompt
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Immediately stop stream — html5-qrcode akan buka ulang
      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (error: any) {
      handleCameraError(error);
      return false;
    }
  }

  function handleCameraError(error: any) {
    setState("error");
    const name = error?.name || "";
    const message_text = error?.message || "";

    if (name === "InsecureContextError") {
      setMessage(
        "Akses kamera diblokir (HTTP). Browser hanya mengizinkan kamera di HTTPS atau localhost. Untuk testing via IP lokal (HP), silakan gunakan HTTPS atau atur flag browser chrome://flags/#unsafely-treat-insecure-origin-as-secure.",
      );
    } else if (
      name === "NotAllowedError" ||
      name === "PermissionDeniedError" ||
      name === "SecurityError" ||
      message_text.includes("Permission denied")
    ) {
      if (isIOS) {
        setMessage(
          "Izin kamera ditolak. Di iOS Safari: buka Pengaturan > Safari > Kamera > pilih Izinkan, lalu kembali ke aplikasi dan coba lagi.",
        );
      } else {
        setMessage(
          "Izin kamera ditolak. Tap ikon kamera di address bar browser, pilih Izinkan, lalu refresh dan coba lagi.",
        );
      }
    } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      setMessage("Kamera tidak ditemukan di perangkat ini.");
    } else if (name === "NotReadableError" || name === "TrackStartError") {
      setMessage(
        "Kamera sedang dipakai aplikasi lain. Tutup aplikasi kamera lain, lalu coba lagi.",
      );
    } else if (
      name === "OverconstrainedError" ||
      name === "ConstraintNotSatisfiedError"
    ) {
      // Fallback: coba tanpa constraint facingMode
      setMessage("Kamera belakang tidak tersedia. Coba ganti ke kamera depan.");
    } else if (
      name === "AbortError" ||
      name === "NotSupportedError" ||
      message_text.includes("HTTPS")
    ) {
      setMessage(
        "Akses kamera memerlukan koneksi HTTPS. Pastikan aplikasi dibuka via https:// atau http://localhost:3000.",
      );
    } else {
      setMessage(
        `Gagal mengakses kamera: ${name || "Unknown error"}. Pastikan aplikasi berjalan di HTTPS/localhost dan izin kamera telah diberikan.`,
      );
    }
  }

  async function startScanning() {
    setState("requesting");
    setMessage("Meminta izin akses kamera...");

    // 1. Minta izin kamera (penting untuk mobile!)
    const permitted = await requestCameraPermission();
    if (!permitted) return;

    setState("scanning");
    setMessage("Mengakses kamera...");

    try {
      await stopScanner();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      const facingMode = useFrontCamera ? "user" : "environment";

      await scanner.start(
        { facingMode },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        async (decodedText) => {
          await stopScanner();
          setState("processing");
          setMessage("Memproses presensi...");

          const result = await submitAttendance(decodedText) as any;
          if (result.success) {
            setState("success");
            setMessage(result.message ?? "Presensi berhasil!");
            setResultData(result);
          } else {
            setState("error");
            setMessage(result.message ?? "Presensi gagal.");
          }
        },
        (errorMessage) => {
          console.debug("QR Scan error:", errorMessage);
        },
      );

      setMessage("Silakan scan QR code!");
    } catch (error: any) {
      console.error("Camera error:", error);
      handleCameraError(error);
    }
  }

  function reset() {
    setState("idle");
    setMessage("");
    setResultData(null);
  }

  function toggleCamera() {
    setUseFrontCamera(!useFrontCamera);
    if (state === "scanning") {
      stopScanner().then(startScanning);
    }
  }

  return (
    <div className={styles.scannerWrapper}>
      <div className={styles.viewport}>
        <div
          id={SCANNER_ELEMENT_ID}
          className="h-full w-full [&_video]:object-cover"
        />

        {state === "scanning" && (
          <div className={styles.viewfinder}>
            <span className={styles.viewfinderCorner} />
            <span className={styles.viewfinderCorner} />
            <span className={styles.viewfinderCorner} />
            <span className={styles.viewfinderCorner} />
            <div className={styles.scanLine} />
          </div>
        )}

        <AnimatePresence>
          {(state === "idle" ||
            state === "requesting" ||
            state === "processing" ||
            state === "success" ||
            state === "error") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={styles.overlay}
            >
              {state === "idle" && (
                <div className={styles.overlayContent}>
                  <CameraOff className={styles.overlayIcon} />
                  <p className={styles.overlayText}>Kamera belum aktif</p>
                </div>
              )}
              {state === "requesting" && (
                <div className={styles.overlayContent}>
                  <ShieldCheck
                    className={`${styles.overlayIcon} ${styles.permissionIcon}`}
                  />
                  <p className={styles.overlayText}>Menunggu izin kamera...</p>
                  <p className={styles.overlayHint}>
                    {isIOS
                      ? "Tap Allow pada dialog izin Safari"
                      : "Tap Izinkan pada dialog izin browser"}
                  </p>
                </div>
              )}
              {state === "processing" && <div className={styles.spinner} />}
              {state === "success" && resultData && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="relative flex flex-col items-center gap-2 px-4 text-center"
                >
                  <div className="relative">
                    <span className={styles.successRing} />
                    <CheckCircle2 className={styles.successIcon} />
                  </div>
                  <p className="text-sm font-semibold text-ink">{resultData.name}</p>
                  <p className="text-sm font-medium" style={{ color: resultData.status === "hadir" ? "#16A34A" : "#D97706" }}>
                    {resultData.status === "hadir" ? "✅ Hadir Tepat Waktu" : "⏰ Telat"}
                  </p>
                  <p className="text-xs text-slate-500">Pukul {resultData.time}</p>
                </motion.div>
              )}
              {state === "error" && (
                <motion.div
                  initial={{ x: -6 }}
                  animate={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 8 }}
                  className={styles.overlayContent}
                >
                  <XCircle className={styles.errorIcon} />
                  <p className="text-sm font-medium text-ink text-center max-w-[280px]">
                    {message}
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(state === "idle" || state === "error") && (
        <div className={styles.btnGroup}>
          <Button variant="blue" onClick={startScanning}>
            <Camera className="h-4 w-4 mr-2" />
            {state === "error" ? "Coba Scan Lagi" : "Mulai Scan QR"}
          </Button>
          {state === "error" && (
            <Button
              variant="outline"
              onClick={toggleCamera}
              className={styles.cameraToggle}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Ganti Kamera
            </Button>
          )}
        </div>
      )}

      {state === "scanning" && (
        <Button
          variant="outline"
          onClick={toggleCamera}
          className={styles.cameraToggle}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Ganti Kamera
        </Button>
      )}

      {state === "success" && (
        <Button variant="outline" onClick={reset}>
          Selesai
        </Button>
      )}
    </div>
  );
}
