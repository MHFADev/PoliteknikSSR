"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { getClasses, addClass, renameClass, deleteClass } from "@/actions/classes";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import styles from "@/styles/pages/dashboard/admin/Kelas.module.css";

export default function KelasPage() {
  const [classes, setClasses] = useState<{ id: string; nama: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNama, setNewNama] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNama, setEditNama] = useState("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; nama: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setClasses(await getClasses());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const show = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleAdd = async () => {
    if (!newNama.trim()) return;
    const result = await addClass(newNama);
    if (result.error) { show("error", result.error); return; }
    setNewNama("");
    setAdding(false);
    load();
  };

  const handleRename = async (id: string) => {
    if (!editNama.trim()) return;
    const result = await renameClass(id, editNama);
    if (result.error) { show("error", result.error); return; }
    setEditingId(null);
    load();
  };

  const handleDelete = async (id: string, nama: string) => {
    setConfirmDelete({ id, nama });
  };

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return;
    const result = await deleteClass(confirmDelete.id);
    if (result.error) { show("error", result.error); }
    setConfirmDelete(null);
    load();
  };

  if (loading) return <div className={styles.pageContainer}><p className="text-sm text-slate-400">Memuat...</p></div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Kelola Kelas</h1>
        <p>Tambah, ubah, atau hapus kelas</p>
      </div>

      {msg && (
        <div className={`${styles.toast} ${msg.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          {msg.text}
          <button onClick={() => setMsg(null)} className={styles.toastClose}><X className="h-4 w-4" /></button>
        </div>
      )}

      <Card>
        <CardHeader
          title="Daftar Kelas"
          action={
            <button onClick={() => setAdding(true)} className={styles.btnPrimary}>
              <Plus className="h-4 w-4" /> Tambah Kelas
            </button>
          }
        />
        <div className={styles.body}>
          {adding && (
            <div className={styles.addRow}>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*"
                value={newNama} onChange={(e) => setNewNama(e.target.value.replace(/\D/g, ""))}
                placeholder="Contoh: 10" className={styles.input} maxLength={2} autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <button onClick={handleAdd} className={styles.btnIcon} style={{ color: "#16A34A" }}><Check className="h-4 w-4" /></button>
              <button onClick={() => { setAdding(false); setNewNama(""); }} className={styles.btnIcon} style={{ color: "#94A3B8" }}><X className="h-4 w-4" /></button>
            </div>
          )}
          {classes.length === 0 ? (
            <p className={styles.empty}>Belum ada kelas. Tambah kelas baru.</p>
          ) : (
            <div className={styles.list}>
              {classes.map((c) => (
                <div key={c.id} className={styles.item}>
                  {editingId === c.id ? (
                    <div className={styles.editRow}>
                      <input
                        type="text" inputMode="numeric" pattern="[0-9]*"
                        value={editNama} onChange={(e) => setEditNama(e.target.value.replace(/\D/g, ""))}
                        className={styles.input} maxLength={2} autoFocus
                        onKeyDown={(e) => e.key === "Enter" && handleRename(c.id)}
                      />
                      <button onClick={() => handleRename(c.id)} className={styles.btnIcon} style={{ color: "#16A34A" }}><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className={styles.btnIcon} style={{ color: "#94A3B8" }}><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <>
                      <span className={styles.nama}>Kelas {c.nama}</span>
                      <div className={styles.actions}>
                        <button onClick={() => { setEditingId(c.id); setEditNama(c.nama); }} className={styles.btnIcon} style={{ color: "#2563EB" }}><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => handleDelete(c.id, c.nama)} className={styles.btnIcon} style={{ color: "#DC2626" }}><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <ConfirmDialog
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteAction}
        title="Hapus Kelas"
        message={`Hapus kelas ${confirmDelete?.nama}? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        variant="danger"
      />
    </div>
  );
}