"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addStudent } from "@/actions/admin";
import { getStudyPrograms } from "@/actions/broadcast";

export function AddStudentModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [programs, setPrograms] = useState<{ id: string; nama: string }[]>([]);

  useEffect(() => {
    if (open) getStudyPrograms().then((data) => setPrograms(data as any));
  }, [open]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const result = await addStudent({
      fullName: form.get("fullName") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
      identityNumber: (form.get("identityNumber") as string) || undefined,
      instansi: (form.get("instansi") as string) || undefined,
      kelas: (form.get("kelas") as string) || undefined,
      jurusanId: (form.get("jurusanId") as string) || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
      return;
    }

    setSuccess("Akun siswa berhasil dibuat!");
    setTimeout(() => {
      setOpen(false);
      setSuccess(null);
    }, 1200);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Siswa
      </Button>

      <Modal open={open} onClose={() => { setOpen(false); setError(null); setSuccess(null); }} title="Tambah Akun Siswa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-deep">Nama Lengkap</label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="Nama siswa"
              className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-deep">Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="siswa@email.com"
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-deep">Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="Min. 6 karakter"
                minLength={6}
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm font-medium text-deep">NIS/NIP</label>
              <input
                name="identityNumber"
                type="text"
                placeholder="NIS siswa"
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-deep">Jurusan</label>
              <select
                name="jurusanId"
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              >
                <option value="">Pilih Jurusan</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-deep">Kelas</label>
              <input
                name="kelas"
                type="text"
                placeholder="XII RPL 1"
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          {success && <p className="text-sm text-green-600">{success}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(null); setSuccess(null); }}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}