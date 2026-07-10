"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { generateTodaySession } from "@/actions/qr";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { AttendanceSession } from "@/types/database";

export function QRGeneratorCard({ initialSession }: { initialSession: AttendanceSession | null }) {
  const [session, setSession] = useState(initialSession);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!session) return setQrImage(null);
    QRCode.toDataURL(session.token, { margin: 1, width: 280, color: { dark: "#2BA8A2" } }).then(
      setQrImage
    );
  }, [session]);

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateTodaySession();
      if (result.data) setSession(result.data);
    });
  }

  return (
    <Card variant="flip7">
      <CardHeader
        title="QR Presensi Hari Ini"
        subtitle={session ? `Berlaku sampai ${formatDate(session.expires_at, true)}` : "Belum ada sesi untuk hari ini"}
        action={
          <Button variant="gold" isLoading={isPending} onClick={handleGenerate}>
            <RefreshCw className="h-4 w-4" />
            {session ? "Generate Ulang" : "Generate QR"}
          </Button>
        }
      />

      <div className="flex justify-center">
        {qrImage ? (
          <motion.img
            key={session?.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            src={qrImage}
            alt="QR Presensi"
            className="rounded-flip7-lg border border-teal-light shadow-flip7-teal-glow"
          />
        ) : (
          <div className="flex h-72 w-72 items-center justify-center rounded-flip7-lg border border-dashed border-teal text-sm text-ink-muted text-center px-6">
            Klik &quot;Generate QR&quot; untuk membuat sesi presensi hari ini
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-ink-muted text-center">
        Tampilkan QR ini di layar/proyektor. Siswa scan lewat menu Absensi QR di dashboard masing-masing.
      </p>
    </Card>
  );
}
