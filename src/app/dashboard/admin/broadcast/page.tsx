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

type StudyProgram = { id: string; nama: string; kode: string };
type Announcement = {
  id: string;
  title: string;
  content: string;
  broadcast_to_all: boolean;
  created_at: string;
  announcement_recipients: { study_program_id: string; study_programs?: { nama: string; kode: string } }[];
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
      setPrograms(progs as StudyProgram[]);
      setAnnouncements(anns as Announcement[]);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-deep">Broadcast Pengumuman</h1>
          <p className="text-sm text-mist-dim">Kirim pengumuman ke siswa berdasarkan jurusan.</p>
        </div>
        <Button onClick={openForm}><Send className="h-4 w-4" /> Kirim Pengumuman</Button>
      </div>

      <Card>
        <CardHeader title="Riwayat Pengumuman" />

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-steel" /></div>
        ) : announcements.length === 0 ? (
          <p className="py-8 text-center text-sm text-mist-dim">Belum ada pengumuman.</p>
        ) : (
          <div className="divide-y divide-deep/6">
            {announcements.map((ann) => (
              <div key={ann.id} className="flex items-start justify-between px-4 py-4">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-vibrant/10 text-blue-vibrant">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-deep">{ann.title}</p>
                    <p className="mt-0.5 text-sm text-steel line-clamp-2">{ann.content}</p>
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      {ann.broadcast_to_all ? (
                        <Badge tone="success">Semua Jurusan</Badge>
                      ) : (
                        ann.announcement_recipients?.map((r) => {
                          const prog = programs.find((p) => p.id === r.study_program_id);
                          return (
                            <Badge key={r.study_program_id} tone="neutral">
                              {prog?.nama ?? r.study_program_id}
                            </Badge>
                          );
                        })
                      )}
                      <span className="text-xs text-mist-dim">{formatDate(ann.created_at)}</span>
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
          <div>
            <label className="text-sm font-medium text-deep">Judul</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} type="text" required placeholder="Pengumuman Libur PKL" className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean" />
          </div>
          <div>
            <label className="text-sm font-medium text-deep">Isi Pengumuman</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} required placeholder="Tulis pengumuman..." className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean resize-none" />
          </div>

          <div>
            <label className="text-sm font-medium text-deep">Target Jurusan</label>
            <div className="mt-2 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={broadcastToAll} onChange={(e) => handleBroadcastAllChange(e.target.checked)} className="rounded border-deep/20 text-blue-vibrant" />
                <span className="text-sm font-medium text-deep">Semua Jurusan</span>
              </label>
              {!broadcastToAll && (
                <div className="ml-5 space-y-1.5 border-l-2 border-deep/10 pl-3">
                  {programs.map((prog) => (
                    <label key={prog.id} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={selectedPrograms.includes(prog.id)} onChange={() => toggleProgram(prog.id)} className="rounded border-deep/20 text-blue-vibrant" />
                      <span className="text-sm text-steel">{prog.nama} ({prog.kode})</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
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
