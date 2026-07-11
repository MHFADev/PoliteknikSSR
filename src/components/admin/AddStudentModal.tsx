"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, ChevronDown } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addStudent, ensureStudyProgram } from "@/actions/admin";
import { getStudyPrograms } from "@/actions/broadcast";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/admin/AddStudentModal.module.css";

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
        <form onSubmit={handleSubmit}>
          <div className={styles.formField}>
            <label className={styles.label}>Nama Lengkap</label>
            <input
              name="fullName"
              type="text"
              required
              placeholder="Nama siswa"
              className={styles.inputBase}
            />
          </div>

          <div className={styles.inputHalfGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                required
                placeholder="siswa@email.com"
                className={styles.inputBase}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="Min. 6 karakter"
                minLength={6}
                className={styles.inputBase}
              />
            </div>
          </div>

          <div className={styles.inputThirdGrid}>
            <div className={styles.formField}>
              <label className={styles.label}>NIS/NIP</label>
              <input
                name="identityNumber"
                type="text"
                placeholder="NIS siswa"
                className={styles.inputBase}
              />
            </div>
            <div className={cn(styles.formField, "relative")} ref={dropdownRef}>
              <label className={styles.label}>Jurusan</label>
              <div className="relative mt-1.5">
                <input
                  name="jurusan"
                  type="text"
                  value={jurusanInput}
                  onChange={(e) => { setJurusanInput(e.target.value); setShowDropdown(true); }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Ketik atau pilih"
                  className={styles.inputBase}
                />
                <ChevronDown
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-mist-dim cursor-pointer"
                  onClick={() => setShowDropdown(!showDropdown)}
                />
              </div>
              {showDropdown && (
                <div className={styles.dropdown}>
                  {filteredPrograms.length > 0 ? (
                    filteredPrograms.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectJurusan(p.nama)}
                        className={styles.dropdownItem}
                      >
                        {p.nama}
                      </button>
                    ))
                  ) : (
                    <p className={styles.dropdownEmpty}>Jurusan baru: &ldquo;{jurusanInput}&rdquo;</p>
                  )}
                </div>
              )}
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Kelas</label>
              <input
                name="kelas"
                type="text"
                placeholder="XII RPL 1"
                className={styles.inputBase}
              />
            </div>
          </div>

          {error && <p className={styles.errorText}>{error}</p>}
          {success && <p className={styles.successText}>{success}</p>}

          <div className={styles.btnGroup}>
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