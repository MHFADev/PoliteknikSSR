"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addStudent, ensureStudyProgram } from "@/actions/admin";
import { getStudyPrograms } from "@/actions/broadcast";

export function AddStudentModal() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [programs, setPrograms] = useState<{ id: string; nama: string }[]>([]);
  const [jurusanInput, setJurusanInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) getStudyPrograms().then((data) => setPrograms(data as any));
  }, [open]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPrograms = programs.filter((p) =>
    p.nama.toLowerCase().includes(jurusanInput.toLowerCase())
  );

  async function ensureJurusan(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    const existing = programs.find((p) => p.nama.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const result = await ensureStudyProgram(trimmed);
    if (result.id) {
      setPrograms((prev) => [...prev, { id: result.id!, nama: trimmed }]);
      return result.id;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const jurusanName = (form.get("jurusan") as string) || "";
    const jurusanId = await ensureJurusan(jurusanName);

    const result = await addStudent({
      fullName: form.get("fullName") as string,
      email: form.get("email") as string,
      password: form.get("password") as string,
      identityNumber: (form.get("identityNumber") as string) || undefined,
      instansi: jurusanName || undefined,
      kelas: (form.get("kelas") as string) || undefined,
      jurusanId: jurusanId || undefined,
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
      setJurusanInput("");
    }, 1200);
  }

  function selectJurusan(nama: string) {
    setJurusanInput(nama);
    setShowDropdown(false);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Siswa
      </Button>

      <Modal open={open} onClose={() => { setOpen(false); setError(null); setSuccess(null); setJurusanInput(""); }} title="Tambah Akun Siswa">
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
            <div className="relative" ref={dropdownRef}>
              <label className="text-sm font-medium text-deep">Jurusan</label>
              <div className="relative mt-1.5">
                <input
                  name="jurusan"
                  type="text"
                  value={jurusanInput}
                  onChange={(e) => { setJurusanInput(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Ketik atau pilih"
                  className="w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 pr-8 text-sm outline-none focus:border-ocean"
                />
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-dim cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              </div>
              {showDropdown && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-deep/10 bg-white shadow-glass max-h-40 overflow-y-auto">
                  {filteredPrograms.length > 0 ? (
                    filteredPrograms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectJurusan(p.nama)}
                        className="w-full px-3 py-2 text-left text-sm text-steel hover:bg-deep/5 hover:text-deep"
                      >
                        {p.nama}
                      </button>
                    ))
                  ) : (
                    <p className="px-3 py-2 text-xs text-mist-dim">Jurusan baru: &ldquo;{jurusanInput}&rdquo;</p>
                  )}
                </div>
              )}
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
            <Button type="button" variant="ghost" onClick={() => { setOpen(false); setError(null); setSuccess(null); setJurusanInput(""); }}>
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