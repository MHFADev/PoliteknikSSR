"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, CameraOff, Camera, RefreshCw } from "lucide-react";
import { submitAttendance } from "@/actions/attendance";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/qr/QRScanner.module.css";

const SCANNER_ELEMENT_ID = "qr-reader-viewport";

type ScanState = "idle" | "scanning" | "processing" | "success" | "error";

export function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState<string>("");
  const [useFrontCamera, setUseFrontCamera] = useState(false);

  useEffect(() => {
    return () => {
      // Pastikan kamera dilepas saat komponen unmount
      stopScanner();
    };
  }, []);

  async function stopScanner() {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }
    } catch {
      // Ignore errors when stopping
    }
  }

  async function checkCameraPermission() {
    try {
      const permissionStatus = await navigator.permissions.query({ name: "camera" as PermissionName });
      if (permissionStatus.state === "denied") {
        return false;
      }
      return true;
    } catch {
      return true; // If permissions API not supported, proceed anyway
    }
  }

  async function startScanning() {
    setState("scanning");
    setMessage("Meminta izin kamera...");

    // Check permissions first
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      setState("error");
      setMessage("Izin kamera ditolak. Silakan aktifkan izin kamera di pengaturan browser Anda.");
      return;
    }

    try {
      // Cleanup any existing scanner first
      await stopScanner();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      scannerRef.current = scanner;

      const facingMode = useFrontCamera ? "user" : "environment";

      setMessage("Menampilkan kamera...");
      await scanner.start(
        { facingMode },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        async (decodedText) => {
          // Hentikan kamera segera setelah dapat 1 hasil supaya tidak submit berkali-kali
          await stopScanner();
          setState("processing");
          setMessage("Memproses presensi...");

          const result = await submitAttendance(decodedText);
          if (result.success) {
            setState("success");
            setMessage(result.message ?? "Presensi berhasil!");
          } else {
            setState("error");
            setMessage(result.message ?? "Presensi gagal.");
          }
        },
        (errorMessage) => {
          // Ignore scan errors, just continue scanning
          console.debug("QR Scan error:", errorMessage);
        }
      );

      // If we got here, camera is running successfully
      setMessage("Silakan scan QR code!");
    } catch (error) {
      console.error("Camera error:", error);
      setState("error");
      setMessage("Tidak bisa mengakses kamera. Pastikan Anda menggunakan HTTPS (untuk produksi) atau localhost (untuk development).");
    }
  }

  function reset() {
    setState("idle");
    setMessage("");
  }

  function toggleCamera() {
    setUseFrontCamera(!useFrontCamera);
    if (state === "scanning") {
      // Restart scanner with new camera
      stopScanner().then(startScanning);
    }
  }

  return (
    <div className={styles.scannerWrapper}>
      <div className={styles.viewport}>
        <div id={SCANNER_ELEMENT_ID} className="h-full w-full [&_video]:object-cover" />

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
          {(state === "idle" || state === "processing" || state === "success" || state === "error") && (
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
              {state === "processing" && (
                <div className={styles.spinner} />
              )}
              {state === "success" && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="relative flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <span className={styles.successRing} />
                    <CheckCircle2 className={styles.successIcon} />
                  </div>
                  <p className="text-sm font-medium text-ink">{message}</p>
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
                  <p className="text-sm font-medium text-ink text-center">{message}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(state === "idle" || state === "error") && (
        <div className={styles.btnGroup}>
          <Button variant="teal" onClick={startScanning}>
            <Camera className="h-4 w-4 mr-2" />
            {state === "error" ? "Coba Scan Lagi" : "Mulai Scan QR"}
          </Button>
          {state === "error" && (
            <Button variant="outline" onClick={toggleCamera} className={styles.cameraToggle}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Switch Kamera
            </Button>
          )}
        </div>
      )}

      {state === "scanning" && (
        <Button variant="outline" onClick={toggleCamera} className={styles.cameraToggle}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Switch Kamera
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
