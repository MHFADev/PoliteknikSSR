"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, CameraOff } from "lucide-react";
import { submitAttendance } from "@/actions/attendance";
import { Button } from "@/components/ui/Button";

const SCANNER_ELEMENT_ID = "qr-reader-viewport";

type ScanState = "idle" | "scanning" | "processing" | "success" | "error";

export function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    return () => {
      // Pastikan kamera dilepas saat komponen unmount
      scannerRef.current?.stop().catch(() => {});
    };
  }, []);

  async function startScanning() {
    setState("scanning");
    setMessage("");

    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        async (decodedText) => {
          // Hentikan kamera segera setelah dapat 1 hasil supaya tidak submit berkali-kali
          await scanner.stop().catch(() => {});
          setState("processing");

          const result = await submitAttendance(decodedText);
          if (result.success) {
            setState("success");
            setMessage(result.message ?? "Presensi berhasil!");
          } else {
            setState("error");
            setMessage(result.message ?? "Presensi gagal.");
          }
        },
        undefined
      );
    } catch {
      setState("error");
      setMessage("Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan.");
    }
  }

  function reset() {
    setState("idle");
    setMessage("");
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="relative h-72 w-72 overflow-hidden rounded-xl2 border border-steel/30 bg-deep/90 shadow-glass-lg">
        <div id={SCANNER_ELEMENT_ID} className="h-full w-full [&_video]:object-cover" />

        {state === "scanning" && (
          <>
            {/* Bingkai viewfinder — signature visual untuk fitur scan */}
            <div className="pointer-events-none absolute inset-6 rounded-2xl border-2 border-mist/70">
              <span className="absolute -top-0.5 -left-0.5 h-6 w-6 border-l-4 border-t-4 border-ocean rounded-tl-lg" />
              <span className="absolute -top-0.5 -right-0.5 h-6 w-6 border-r-4 border-t-4 border-ocean rounded-tr-lg" />
              <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 border-l-4 border-b-4 border-ocean rounded-bl-lg" />
              <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 border-r-4 border-b-4 border-ocean rounded-br-lg" />
              <div className="absolute inset-x-0 top-0 h-0.5 bg-ocean/80 animate-scan-line" />
            </div>
          </>
        )}

        <AnimatePresence>
          {(state === "idle" || state === "processing" || state === "success" || state === "error") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-deep/90 text-mist px-6 text-center"
            >
              {state === "idle" && (
                <>
                  <CameraOff className="h-9 w-9 text-mist/60" />
                  <p className="text-sm text-mist/80">Kamera belum aktif</p>
                </>
              )}
              {state === "processing" && (
                <motion.div
                  className="h-9 w-9 rounded-full border-2 border-mist/30 border-t-ocean"
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
                    <span className="absolute inset-0 rounded-full bg-ocean/40 animate-pulse-ring" />
                    <CheckCircle2 className="relative h-12 w-12 text-ocean-light" />
                  </div>
                  <p className="text-sm font-medium text-mist">{message}</p>
                </motion.div>
              )}
              {state === "error" && (
                <motion.div
                  initial={{ x: -6 }}
                  animate={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 8 }}
                  className="flex flex-col items-center gap-2"
                >
                  <XCircle className="h-12 w-12 text-steel" />
                  <p className="text-sm font-medium text-mist text-center">{message}</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {(state === "idle" || state === "error") && (
        <Button onClick={startScanning}>{state === "error" ? "Coba Scan Lagi" : "Mulai Scan QR"}</Button>
      )}
      {state === "success" && (
        <Button variant="outline" onClick={reset}>
          Selesai
        </Button>
      )}
    </div>
  );
}
