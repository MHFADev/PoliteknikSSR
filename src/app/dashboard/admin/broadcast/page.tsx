"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Trash2, Loader2, Megaphone } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { getStudyPrograms, getAnnouncements, sendAnnouncement, deleteAnnouncement } from "@/actions/broadcast";
import { formatDate } from "@/lib/utils";
import styles from "@/styles/pages/dashboard/admin/Broadcast.module.css";

type StudyProgram = { id: string; nama: string; kode: string };
type Announcement = {
  id: string;
  title: string;
  content: string;
  broadcastToAll: boolean;
  createdAt: string;
  recipients: string[];
};

export default function AdminBroadcastPage() {
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [broadcastToAll, setBroadcastToAll] = useState(true);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);

  function loadData() {
    setLoading(true);
    Promise.all([getStudyPrograms(), getAnnouncements()]).then(([progs, anns]) => {
      setPrograms(progs as unknown as StudyProgram[]);
      setAnnouncements(anns as unknown as Announcement[]);
      setLoading(false);
    });
  }

  useEffect(() => { loadData(); }, []);

  function toggleProgram(id: string) {
    setSelectedPrograms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  function handleBroadcastAllChange(val: boolean) {
    setBroadcastToAll(val);
    if (val) setSelectedPrograms([]);
  }

  function openForm() {
    setTitle("");
    setContent("");
    setBroadcastToAll(true);
    setSelectedPrograms([]);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("Judul dan isi pengumuman harus diisi.");
      return;
    }
    if (!broadcastToAll && selectedPrograms.length === 0) {
      setError("Pilih minimal satu jurusan atau gunakan 'Semua Jurusan'.");
      return;
    }

    setIsSubmitting(true);
    const result = await sendAnnouncement(title, content, broadcastToAll, selectedPrograms);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "Gagal mengirim.");
      return;
    }

    setModalOpen(false);
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus pengumuman ini?")) return;
    await deleteAnnouncement(id);
    loadData();
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1>Broadcast Pengumuman</h1>
          <p>Kirim pengumuman ke siswa berdasarkan jurusan.</p>
        </div>
        <Button onClick={openForm}><Send className="h-4 w-4" /> Kirim Pengumuman</Button>
      </div>

      <Card>
        <CardHeader title="Riwayat Pengumuman" />

        {loading ? (
          <div className={styles.loadingSpinner}><Loader2 className="h-6 w-6 animate-spin text-steel" /></div>
        ) : announcements.length === 0 ? (
          <p className={styles.emptyState}>Belum ada pengumuman.</p>
        ) : (
          <div className={styles.announcementList}>
            {announcements.map((ann) => (
              <div key={ann.id} className={styles.announcementItem}>
                <div className={styles.announcementInner}>
                  <div className={styles.announcementIcon}>
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className={styles.announcementContent}>
                    <p className={styles.announcementTitle}>{ann.title}</p>
                    <p className={styles.announcementBody}>{ann.content}</p>
                    <div className={styles.announcementMeta}>
                      {ann.broadcastToAll ? (
                        <Badge tone="success">Semua Jurusan</Badge>
                      ) : (
                        ann.recipients?.map((spId) => {
                          const prog = programs.find((p) => p.id === spId);
                          return (
                            <Badge key={spId} tone="neutral">
                              {prog?.nama ?? spId}
                            </Badge>
                          );
                        })
                      )}
                      <span className={styles.announcementDate}>{formatDate(ann.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" onClick={() => handleDelete(ann.id)}>
                  <Trash2 className="h-4 w-4 text-danger" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setError(null); }} title="Kirim Pengumuman">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Judul</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" required placeholder="Pengumuman Libur PKL" className={styles.formInput} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Isi Pengumuman</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required placeholder="Tulis pengumuman..." className={styles.formTextarea} />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Target Jurusan</label>
            <div className="mt-2 space-y-2">
              <label className={styles.checkboxLabel}>
                <input type="checkbox" checked={broadcastToAll} onChange={(e) => handleBroadcastAllChange(e.target.checked)} className="rounded border-deep/20 text-blue-vibrant" />
                <span>Semua Jurusan</span>
              </label>
              {!broadcastToAll && (
                <div className={styles.checkboxGroup}>
                  {programs.map((prog) => (
                    <label key={prog.id} className={styles.programCheckbox}>
                      <input type="checkbox" checked={selectedPrograms.includes(prog.id)} onChange={() => toggleProgram(prog.id)} className="rounded border-deep/20 text-blue-vibrant" />
                      <span>{prog.nama} ({prog.kode})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.modalActions}>
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setError(null); }}>Batal</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" /> Kirim
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
