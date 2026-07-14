"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Loader2,
  GraduationCap,
  Trash2,
  BookOpen,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getStudyPrograms,
  createStudyProgram,
  deleteStudyProgram,
} from "@/actions/admin";
import styles from "@/styles/pages/dashboard/admin/StudyPrograms.module.css";

type StudyProgram = { id: string; nama: string; kode: string };

export default function AdminStudyProgramsPage() {
  const [programs, setPrograms] = useState<StudyProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function loadData() {
    setLoading(true);
    getStudyPrograms().then((data) => {
      if (Array.isArray(data)) setPrograms(data);
      setLoading(false);
    });
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = nama.trim();
    if (!trimmed) {
      setError("Nama program studi wajib diisi.");
      return;
    }

    setSubmitting(true);
    const result = await createStudyProgram(trimmed, kode.trim() || undefined);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setNama("");
    setKode("");
    setError(null);
    loadData();
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteStudyProgram(id);
    setDeletingId(null);
    if (!result.error) loadData();
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Program Studi</h1>
        <p>Kelola daftar jurusan / program studi</p>
      </div>

      <div className={styles.layout}>
        {/* ─── Daftar Program Studi ─────────────────────── */}
        <Card className={styles.listCard}>
          <CardHeader title="Daftar Program Studi" icon={<BookOpen className="w-5 h-5" />} />

          {loading ? (
            <div className={styles.loadingState}>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Memuat data...</span>
            </div>
          ) : programs.length === 0 ? (
            <p className={styles.emptyState}>
              Belum ada program studi. Silakan tambah yang baru.
            </p>
          ) : (
            <div className={styles.list}>
              {programs.map((p, idx) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={styles.listItem}
                >
                  <div className={styles.listItemInfo}>
                    <span className={styles.listItemNama}>{p.nama}</span>
                    <Badge tone="neutral" size="sm">{p.kode}</Badge>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className={styles.deleteBtn}
                    aria-label={`Hapus ${p.nama}`}
                  >
                    {deletingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </Card>

        {/* ─── Tambah Program Studi Baru ────────────────── */}
        <Card className={styles.formCard}>
          <CardHeader
            title="Tambah Program Studi"
            icon={<GraduationCap className="w-5 h-5" />}
          />

          <form onSubmit={handleCreate} className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="nama">
                Nama Program Studi
              </label>
              <input
                id="nama"
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: D4 Teknik Informatika"
                className={styles.input}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="kode">
                Kode <span className={styles.optional}>(opsional)</span>
              </label>
              <input
                id="kode"
                type="text"
                value={kode}
                onChange={(e) => setKode(e.target.value.toUpperCase())}
                placeholder="Contoh: D4-TI"
                className={styles.input}
              />
              <p className={styles.helper}>
                Jika kosong, kode akan dibuat otomatis dari nama.
              </p>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                className={styles.error}
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              disabled={submitting}
              className={styles.submitBtn}
            >
              <Plus className="w-4 h-4" />
              Tambah Program Studi
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
