"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, X, FileText } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { reviewLeaveRequest } from "@/actions/leave";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/izin/LeaveApprovalModal.module.css";

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
      <div className={styles.emptyState}>
        Tidak ada pengajuan izin yang menunggu review 🎉
      </div>
    );
  }

  return (
    <div className={styles.requestList}>
      {requests.map((req) => (
        <motion.button
          key={req.id}
          layout
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: -20 }}
          onClick={() => setActive(req)}
          className={styles.requestItem}
        >
          <div className={styles.requestInfo}>
            <p className={styles.requestName}>{req.student.full_name}</p>
            <p className={styles.requestReason}>{req.reason}</p>
          </div>
          <div className={styles.requestMeta}>
            <Badge tone="warning">{req.type}</Badge>
            <span className="text-xs text-mist-dim">{formatDate(req.start_date)}</span>
          </div>
        </motion.button>
      ))}

      <Modal open={!!active} onClose={() => setActive(null)} title="Detail Pengajuan Izin">
        {active && (
          <div className={styles.detailSection}>
            <div>
              <p className={styles.detailLabel}>Siswa</p>
              <p className={styles.detailValue}>
                {active.student.full_name}{" "}
                {active.student.identity_number && (
                  <span className="text-mist-dim font-normal">· {active.student.identity_number}</span>
                )}
              </p>
            </div>
            <div className={styles.detailRow}>
              <div>
                <p className={styles.detailLabel}>Tanggal</p>
                <p className={styles.detailValue}>
                  {formatDate(active.start_date)} – {formatDate(active.end_date)}
                </p>
              </div>
              <div>
                <p className={styles.detailLabel}>Jenis</p>
                <Badge tone="warning">{active.type}</Badge>
              </div>
            </div>
            <div>
              <p className={styles.detailLabel}>Alasan</p>
              <p className={styles.detailValue}>{active.reason}</p>
            </div>
            {active.proof_url && (
              <a
                href={active.proof_url}
                target="_blank"
                rel="noreferrer"
                className={styles.proofLink}
              >
                <FileText className="h-4 w-4" /> Lihat bukti pendukung
              </a>
            )}
            <div>
              <div className="flex justify-between items-center">
                <label className={styles.detailLabel}>Catatan (opsional)</label>
                <span className="text-xs text-mist-dim">{note.length}/100</span>
              </div>
              <textarea
                rows={2}
                maxLength={100}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan untuk siswa..."
                className={styles.noteInput}
              />
            </div>
            <div className={styles.actionBtns}>
              <Button
                variant="danger"
                isLoading={isSubmitting}
                onClick={() => handleDecision("ditolak")}
              >
                <X className="h-4 w-4" /> Tolak
              </Button>
              <Button isLoading={isSubmitting} onClick={() => handleDecision("disetujui")}>
                <Check className="h-4 w-4" /> Setujui
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
