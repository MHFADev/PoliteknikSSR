"use client";

import { useEffect, useState, useTransition } from "react";
import QRCode from "qrcode";
import { motion } from "framer-motion";
import { RefreshCw, Settings } from "lucide-react";
import { generateTodaySession } from "@/actions/qr";
import { saveAttendanceSettings, getAttendanceSettings } from "@/actions/attendance";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import type { AttendanceSession } from "@/lib/repositories";
import styles from "@/styles/components/qr/QRGeneratorCard.module.css";

export function QRGeneratorCard({
  initialSession,
  showSettings = true,
}: {
  initialSession: AttendanceSession | null;
  showSettings?: boolean;
}) {
  const [session, setSession] = useState(initialSession);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lateTime, setLateTime] = useState("08:00");
  const [qrDuration, setQrDuration] = useState(12);
  const [saving, setSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState<string | null>(null);

  useEffect(() => {
    getAttendanceSettings().then((s) => {
      setLateTime(s.lateTime);
      setQrDuration(s.qrDuration);
    });
  }, []);

  useEffect(() => {
    if (!session) return setQrImage(null);
    QRCode.toDataURL(session.token, {
      margin: 1,
      width: 280,
      color: { dark: "#3572EF" },
    }).then(setQrImage);
  }, [session]);

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateTodaySession();
      if (result.data) setSession(result.data);
    });
  }

  async function handleSaveSettings() {
    setSaving(true);
    const result = await saveAttendanceSettings(lateTime, qrDuration);
    if (result.error) setSettingsMsg(result.error);
    else setSettingsMsg("Pengaturan disimpan!");
    setTimeout(() => setSettingsMsg(null), 3000);
    setSaving(false);
  }

  return (
    <Card variant="flip7" className={styles.card}>
      <CardHeader
        title="QR Presensi Hari Ini"
        subtitle={
          session
            ? `Berlaku sampai ${formatDate(session.expiresAt ?? "", true)}`
            : "Belum ada sesi untuk hari ini"
        }
        action={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {showSettings && (
              <Button variant="outline" onClick={() => setSettingsOpen(!settingsOpen)}>
                <Settings className="h-4 w-4" />
              </Button>
            )}
            <Button variant="blue" isLoading={isPending} onClick={handleGenerate}>
              <RefreshCw className="h-4 w-4" />
              {session ? "Generate Ulang" : "Generate QR"}
            </Button>
          </div>
        }
      />

      {settingsOpen && (
        <div style={{ padding: "0 1.25rem 1rem", display: "flex", flexDirection: "column", gap: "0.75rem", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", gap: "1rem", alignItems: "end" }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem", display: "block" }}>Jam Mulai Telat</label>
              <input type="time" value={lateTime} onChange={(e) => setLateTime(e.target.value)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #CBD5E1", borderRadius: "0.5rem", fontSize: "0.875rem" }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem", display: "block" }}>Durasi QR (jam)</label>
              <input type="number" min={1} max={48} value={qrDuration} onChange={(e) => setQrDuration(parseInt(e.target.value) || 12)}
                style={{ width: "100%", padding: "0.5rem", border: "1px solid #CBD5E1", borderRadius: "0.5rem", fontSize: "0.875rem" }}
              />
            </div>
            <button onClick={handleSaveSettings} disabled={saving}
              style={{ padding: "0.5rem 1rem", background: "#2563EB", color: "#fff", border: "none", borderRadius: "0.5rem", fontSize: "0.8125rem", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              {saving ? "..." : "Simpan"}
            </button>
          </div>
          {settingsMsg && <p style={{ fontSize: "0.75rem", color: settingsMsg.includes("Gagal") ? "#DC2626" : "#16A34A" }}>{settingsMsg}</p>}
        </div>
      )}

      <div className={styles.qrDisplay}>
        {qrImage ? (
          <motion.img
            key={session?.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            src={qrImage}
            alt="QR Presensi"
            className={styles.qrImage}
          />
        ) : (
          <div className={styles.qrPlaceholder}>
            Klik &quot;Generate QR&quot; untuk membuat sesi presensi hari ini
          </div>
        )}
      </div>

      <p className={styles.helperText}>
        Tampilkan QR ini di layar/proyektor. Siswa scan lewat menu Absensi QR di
        dashboard masing-masing.
      </p>
    </Card>
  );
}