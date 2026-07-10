"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, CameraOff, Camera, RefreshCw } from "lucide-react";
import { submitAttendance } from "@/actions/attendance";
import { Button } from "@/components/ui/Button";

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
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-72 w-72 overflow-hidden rounded-flip7-lg border border-outline bg-surface shadow-flip7-card">
        <div id={SCANNER_ELEMENT_ID} className="h-full w-full [&_video]:object-cover" />

        {state === "scanning" && (
          <>
            {/* Bingkai viewfinder — signature visual untuk fitur scan */}
            <div className="pointer-events-none absolute inset-6 rounded-flip7-lg border-2 border-teal">
              <span className="absolute -top-0.5 -left-0.5 h-6 w-6 border-l-4 border-t-4 border-teal rounded-tl-flip7-pill" />
              <span className="absolute -top-0.5 -right-0.5 h-6 w-6 border-r-4 border-t-4 border-teal rounded-tr-flip7-pill" />
              <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 border-l-4 border-b-4 border-teal rounded-bl-flip7-pill" />
              <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 border-r-4 border-b-4 border-teal rounded-br-flip7-pill" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-teal animate-scan-line" />
            </div>
          </>
        )}

        <AnimatePresence>
          {(state === "idle" || state === "processing" || state === "success" || state === "error") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-surface/95 text-ink px-6 text-center"
            >
              {state === "idle" && (
                <>
                  <CameraOff className="h-9 w-9 text-ink-muted" />
                  <p className="text-sm text-ink-muted">Kamera belum aktif</p>
                </>
              )}
              {state === "processing" && (
                <motion.div
                  className="h-9 w-9 rounded-full border-2 border-outline border-t-teal"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                />
              )}
              {state === "success" && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 18 }}
                  className="relative flex flex-col items-center gap-2"
                >
                  <div className="relative">
                    <span className="absolute inset-0 rounded-full bg-leaf/30 animate-pulse-ring" />
                    <CheckCircle2 className="relative h-12 w-12 text-leaf" />
                  </div>
                  <p className="text-sm font-medium text-ink">{message}</p>
                </motion.div>
              )}
              {state === "error" && (
                <motion.div
                  initial={{ x: -6 }}
                  animate={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 8 }}
                  className="flex flex-col items-center gap-2"
                >
                  <XCircle className="h-12 w-12 text-coral" />
                  <p className="text-sm font-medium text-ink text-center">{message}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(state === "idle" || state === "error") && (
        <div className="flex flex-col items-center gap-3">
          <Button variant="teal" onClick={startScanning}>
            <Camera className="h-4 w-4 mr-2" />
            {state === "error" ? "Coba Scan Lagi" : "Mulai Scan QR"}
          </Button>
          {state === "error" && (
            <Button variant="outline" onClick={toggleCamera}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Switch Kamera
            </Button>
          )}
        </div>
      )}

      {state === "scanning" && (
        <Button variant="outline" onClick={toggleCamera}>
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
