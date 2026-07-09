"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { motion } from "framer-motion";
import { UploadCloud, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createLeaveRequest } from "@/actions/leave";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

const LEAVE_TYPES = [
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "cuti", label: "Cuti" },
] as const;

export function LeaveRequestForm() {
  const [type, setType] = useState<(typeof LEAVE_TYPES)[number]["value"]>("izin");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi login tidak ditemukan.");

      let proof_path: string | null = null;
      let proof_url: string | null = null;

      if (file) {
        // Kompres di sisi client SEBELUM upload — mengurangi ukuran file secara signifikan
        // (foto surat dokter/HP biasanya 3-8MB, dikompres ke <1MB) supaya hemat storage & bandwidth.
        const compressed = await imageCompression(file, {
          maxSizeMB: 0.8,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
        });

        const path = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const { error: uploadError } = await supabase.storage
          .from("leave-proofs")
          .upload(path, compressed, { upsert: false, contentType: compressed.type });

        if (uploadError) throw new Error("Gagal upload bukti: " + uploadError.message);

        proof_path = path;
        proof_url = supabase.storage.from("leave-proofs").getPublicUrl(path).data.publicUrl;
      }

      const result = await createLeaveRequest({
        type,
        reason,
        start_date: startDate,
        end_date: endDate,
        proof_path,
        proof_url,
      });

      if (result.error) throw new Error(result.error);

      setSuccess(true);
      setReason("");
      setFile(null);
      setStartDate("");
      setEndDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="Ajukan Izin / Sakit / Cuti" subtitle="Lampirkan bukti pendukung jika ada" />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-deep">Jenis Pengajuan</label>
          <div className="mt-1.5 flex gap-2">
            {LEAVE_TYPES.map((t) => (
              <button
                type="button"
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-xl px-4 py-2 text-sm font-medium border transition-colors ${
                  type === t.value
                    ? "border-blue-vibrant bg-blue-vibrant/10 text-blue-vibrant"
                    : "border-deep/10 text-steel hover:bg-deep/5"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-deep">Tanggal Mulai</label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-ocean"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-deep">Tanggal Selesai</label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-ocean"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-deep">Alasan</label>
          <textarea
            required
            minLength={10}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Jelaskan alasan pengajuan secara singkat..."
            className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-ocean"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-deep">Bukti Pendukung (opsional)</label>
          <label className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-deep/15 px-4 py-3 text-sm text-steel hover:bg-deep/5">
            <UploadCloud className="h-4 w-4" />
            {file ? file.name : "Pilih foto surat / dokumen (JPG, PNG)"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 rounded-xl bg-blue-vibrant/10 px-3 py-2 text-sm text-blue-vibrant"
          >
            <CheckCircle2 className="h-4 w-4" />
            Pengajuan terkirim. Menunggu review pembimbing.
          </motion.div>
        )}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Kirim Pengajuan
        </Button>
      </form>
    </Card>
  );
}
