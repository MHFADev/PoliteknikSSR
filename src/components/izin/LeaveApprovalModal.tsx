"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { reviewLeaveRequest } from "@/actions/leave";
import { formatDate } from "@/lib/utils";

interface LeaveRequestWithStudent {
  id: string;
  type: "izin" | "sakit" | "cuti";
  reason: string;
  start_date: string;
  end_date: string;
  proof_url: string | null;
  student: { full_name: string; identity_number: string | null };
}

export function PendingLeaveApprovals({ initialRequests }: { initialRequests: LeaveRequestWithStudent[] }) {
  const [requests, setRequests] = useState(initialRequests);
  const [active, setActive] = useState<LeaveRequestWithStudent | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleDecision(decision: "disetujui" | "ditolak") {
    if (!active) return;
    setIsSubmitting(true);

    // Optimistic update: langsung hilangkan dari daftar pending supaya terasa instan,
    // dikembalikan lagi kalau ternyata gagal di server.
    const previous = requests;
    setRequests((r) => r.filter((req) => req.id !== active.id));

    const result = await reviewLeaveRequest({ id: active.id, decision, review_note: note });

    setIsSubmitting(false);
    setActive(null);
    setNote("");

    if (result.error) {
      setRequests(previous);
    }
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-deep/15 py-12 text-center text-sm text-mist-dim">
        Tidak ada pengajuan izin yang menunggu review 🎉
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((req) => (
        <motion.button
          key={req.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          onClick={() => setActive(req)}
          className="flex w-full items-center justify-between gap-4 rounded-xl border border-steel/30 bg-mist-soft/80 backdrop-blur px-5 py-4 text-left shadow-glass hover:shadow-glass-lg transition-shadow"
        >
          <div className="min-w-0">
            <p className="font-medium text-deep">{req.student.full_name}</p>
            <p className="text-xs text-mist-dim truncate max-w-md">{req.reason}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Badge tone="warning">{req.type}</Badge>
            <span className="text-xs text-mist-dim">{formatDate(req.start_date)}</span>
          </div>
        </motion.button>
      ))}

      <Modal open={!!active} onClose={() => setActive(null)} title="Detail Pengajuan Izin">
        {active && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-mist-dim">Siswa</p>
              <p className="font-medium text-deep">
                {active.student.full_name}{" "}
                {active.student.identity_number && (
                  <span className="text-mist-dim font-normal">· {active.student.identity_number}</span>
                )}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-mist-dim">Tanggal</p>
                <p className="text-sm text-deep">
                  {formatDate(active.start_date)} – {formatDate(active.end_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-mist-dim">Jenis</p>
                <Badge tone="warning">{active.type}</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-mist-dim">Alasan</p>
              <p className="text-sm text-deep">{active.reason}</p>
            </div>
            {active.proof_url && (
              <a
                href={active.proof_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-blue-vibrant hover:underline"
              >
                <FileText className="h-4 w-4" /> Lihat bukti pendukung
              </a>
            )}
            <div>
              <label className="text-sm font-medium text-deep">Catatan (opsional)</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan untuk siswa..."
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/70 px-3 py-2 text-sm outline-none focus:border-ocean"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="danger"
                className="flex-1"
                isLoading={isSubmitting}
                onClick={() => handleDecision("ditolak")}
              >
                <X className="h-4 w-4" /> Tolak
              </Button>
              <Button className="flex-1" isLoading={isSubmitting} onClick={() => handleDecision("disetujui")}>
                <Check className="h-4 w-4" /> Setujui
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
