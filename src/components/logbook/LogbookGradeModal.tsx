"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { gradeLogbookEntry } from "@/actions/logbook";
import { formatDate } from "@/lib/utils";

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
          className="flex w-full items-center justify-between gap-4 rounded-skylearn-xl border border-outline bg-surface px-5 py-4 text-left shadow-sm hover:shadow-skylearn transition-shadow"
        >
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{entry.student.full_name}</p>
            <p className="text-xs text-ink-subtle truncate max-w-md">{entry.content}</p>
            {entry.photo_url && <p className="text-[10px] text-leaf mt-1">📷 Foto bukti tersedia</p>}
          </div>
          <div className="flex items-center gap-3 shrink-0">
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
                <div className="mt-3">
                  <img 
                    src={active.photo_url} 
                    alt="Bukti kegiatan" 
                    className="w-full max-h-64 object-cover rounded-skylearn-lg border border-outline"
                  />
                </div>
              )}
              <p className="mt-3 text-sm text-ink whitespace-pre-wrap rounded-skylearn-md bg-surface-sunken p-4">
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
                className="mt-2 w-full accent-sky"
              />
              <p className="text-center font-display text-2xl font-semibold text-sky mt-1">{grade}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Feedback</label>
              <textarea
                rows={3}
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Berikan masukan untuk siswa..."
                className="mt-1.5 w-full rounded-skylearn-md border border-outline bg-surface px-3 py-2 text-sm outline-none focus:border-sky"
              />
            </div>
            <Button className="w-full h-12 rounded-skylearn-lg bg-sky hover:bg-sky-deep" isLoading={isSubmitting} onClick={handleSave}>
              Simpan Penilaian
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
