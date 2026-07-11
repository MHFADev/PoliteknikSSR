"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { gradeLogbookEntry } from "@/actions/logbook";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/logbook/LogbookGradeModal.module.css";

interface LogbookWithStudent {
  id: string;
  entry_date: string;
  content: string;
  grade: number | null;
  feedback: string | null;
  photo_url: string | null;
  student: { full_name: string };
}

export function LogbookReviewList({ initialEntries }: { initialEntries: LogbookWithStudent[] }) {
  const [entries, setEntries] = useState(initialEntries);
  const [active, setActive] = useState<LogbookWithStudent | null>(null);
  const [grade, setGrade] = useState(80);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function openEntry(entry: LogbookWithStudent) {
    setActive(entry);
    setGrade(entry.grade ?? 80);
    setFeedback(entry.feedback ?? "");
  }

  async function handleSave() {
    if (!active) return;
    setIsSubmitting(true);

    // Optimistic update supaya penilaian terasa instan di UI
    const previous = entries;
    setEntries((list) => list.map((e) => (e.id === active.id ? { ...e, grade, feedback } : e)));

    const result = await gradeLogbookEntry({ id: active.id, grade, feedback });

    setIsSubmitting(false);
    setActive(null);

    if (result.error) setEntries(previous);
  }

  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <motion.button
          key={entry.id}
          layout
          onClick={() => openEntry(entry)}
          className={styles.entryItem}
        >
          <div className={styles.entryInfo}>
            <p className={styles.entryName}>{entry.student.full_name}</p>
            <p className={styles.entryContent}>{entry.content}</p>
            {entry.photo_url && <p className="text-[10px] text-leaf mt-1">📷 Foto bukti tersedia</p>}
          </div>
          <div className={styles.entryMeta}>
            {entry.grade !== null ? (
              <Badge tone="success">Nilai {entry.grade}</Badge>
            ) : (
              <Badge tone="neutral">Belum dinilai</Badge>
            )}
            <span className="text-xs text-ink-subtle">{formatDate(entry.entry_date)}</span>
          </div>
        </motion.button>
      ))}

      <Modal open={!!active} onClose={() => setActive(null)} title="Review Kegiatan">
        {active && (
          <div className="space-y-5">
            <div>
              <p className="text-sm text-ink-muted">{active.student.full_name} · {formatDate(active.entry_date)}</p>
              {active.photo_url && (
                // Ganti <img> ke <Image> dengan fill; parent div diberi position relative
                <div className="mt-3" style={{ position: 'relative', minHeight: 200 }}>
                  <Image 
                    src={active.photo_url} 
                    alt="Bukti kegiatan" 
                    fill
                    unoptimized={true}
                    className={styles.detailPhoto}
                  />
                </div>
              )}
              <p className={styles.detailContentBox}>
                {active.content}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Nilai (0–100)</label>
              <input
                type="range"
                min={0}
                max={100}
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className={styles.gradeSlider}
              />
              <p className={styles.gradeValue}>{grade}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Feedback</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan masukan untuk siswa..."
                className={styles.feedbackInput}
              />
            </div>
            <Button className={styles.saveBtn} isLoading={isSubmitting} onClick={handleSave}>
              Simpan Penilaian
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
