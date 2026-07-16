"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, ChevronDown, X, User, Mail, Lock, CreditCard, Building2, GraduationCap, Phone, MapPin, Calendar, Users } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { addStudent, ensureStudyProgram } from "@/actions/admin";
import { getStudyPrograms } from "@/actions/broadcast";
import { getClasses } from "@/actions/classes";
import { cn } from "@/lib/utils";
import styles from "@/styles/components/admin/AddStudentModal.module.css";

type Step = "account" | "details" | "confirm";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "account", label: "Akun", icon: <User className="h-4 w-4" /> },
  { key: "details", label: "Data Diri", icon: <CreditCard className="h-4 w-4" /> },
  { key: "confirm", label: "Konfirmasi", icon: <GraduationCap className="h-4 w-4" /> },
];

export function AddStudentModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("account");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [programs, setPrograms] = useState<{ id: string; nama: string }[]>([]);
  const [classList, setClassList] = useState<{ id: string; nama: string }[]>([]);
  const [jurusanInput, setJurusanInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Form data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    identityNumber: "",
    jurusan: "",
    jurusanId: "",
    kelas: "",
    phone: "",
    address: "",
    gender: "",
    birthDate: "",
  });

  useEffect(() => {
    if (open) {
      getStudyPrograms().then((data) => setPrograms(data as any));
      getClasses().then(setClassList);
    }
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
    p.nama.toLowerCase().includes(jurusanInput.toLowerCase()),
  );

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function ensureJurusan(name: string): Promise<string | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = programs.find(
      (p) => p.nama.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existing) return existing.id;
    const result = await ensureStudyProgram(trimmed);
    if (result.id) {
      setPrograms((prev) => [...prev, { id: result.id!, nama: trimmed }]);
      return result.id;
    }
    return null;
  }

  function selectJurusan(nama: string) {
    setJurusanInput(nama);
    updateField("jurusan", nama);
    setShowDropdown(false);
  }

  function canProceed(currentStep: Step): boolean {
    if (currentStep === "account") {
      return formData.fullName.length >= 3 && formData.email.includes("@") && formData.password.length >= 6;
    }
    return true;
  }

  function nextStep() {
    if (step === "account" && !canProceed("account")) {
      setError("Nama, email, dan password (min. 6 karakter) wajib diisi.");
      return;
    }
    setError(null);
    if (step === "account") setStep("details");
    else if (step === "details") setStep("confirm");
  }

  function prevStep() {
    setError(null);
    if (step === "details") setStep("account");
    else if (step === "confirm") setStep("details");
  }

  function resetForm() {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      identityNumber: "",
      jurusan: "",
      jurusanId: "",
      kelas: "",
      phone: "",
      address: "",
      gender: "",
      birthDate: "",
    });
    setJurusanInput("");
    setStep("account");
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const jurusanId = await ensureJurusan(formData.jurusan);

    const result = await addStudent({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      identityNumber: formData.identityNumber || undefined,
      instansi: formData.jurusan || undefined,
      kelas: formData.kelas || undefined,
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
      resetForm();
    }, 1500);
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Tambah Siswa
      </Button>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          resetForm();
        }}
        title="Tambah Akun Siswa"
      >
        {/* Step Indicator */}
        <div className={styles.stepIndicator}>
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                styles.stepItem,
                step === s.key && styles.stepActive,
                STEPS.findIndex((x) => x.key === step) > i && styles.stepCompleted,
              )}
            >
              <div className={styles.stepCircle}>
                {STEPS.findIndex((x) => x.key === step) > i ? (
                  <span className={styles.stepCheck}>&#10003;</span>
                ) : (
                  s.icon
                )}
              </div>
              <span className={styles.stepLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <AnimatePresence mode="wait">
            {step === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={styles.stepContent}
              >
                <div className={styles.sectionTitle}>
                  <User className="h-4 w-4" />
                  <span>Informasi Akun</span>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    <span className={styles.required}>*</span> Nama Lengkap
                  </label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} />
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder="Masukkan nama lengkap siswa"
                      className={styles.inputBase}
                      required
                      minLength={3}
                    />
                  </div>
                </div>

                <div className={styles.inputHalfGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Email
                    </label>
                    <div className={styles.inputWrapper}>
                      <Mail className={styles.inputIcon} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateField("email", e.target.value)}
                        placeholder="siswa@email.com"
                        className={styles.inputBase}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      <span className={styles.required}>*</span> Password
                    </label>
                    <div className={styles.inputWrapper}>
                      <Lock className={styles.inputIcon} />
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => updateField("password", e.target.value)}
                        placeholder="Min. 6 karakter"
                        className={styles.inputBase}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.inputHalfGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Jenis Kelamin</label>
                    <div className={styles.radioGroup}>
                      <label className={cn(styles.radioItem, formData.gender === "L" && styles.radioActive)}>
                        <input
                          type="radio"
                          name="gender"
                          value="L"
                          checked={formData.gender === "L"}
                          onChange={(e) => updateField("gender", e.target.value)}
                          className={styles.radioInput}
                        />
                        <Users className="h-4 w-4" />
                        Laki-laki
                      </label>
                      <label className={cn(styles.radioItem, formData.gender === "P" && styles.radioActive)}>
                        <input
                          type="radio"
                          name="gender"
                          value="P"
                          checked={formData.gender === "P"}
                          onChange={(e) => updateField("gender", e.target.value)}
                          className={styles.radioInput}
                        />
                        <Users className="h-4 w-4" />
                        Perempuan
                      </label>
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Tanggal Lahir</label>
                    <div className={styles.inputWrapper}>
                      <Calendar className={styles.inputIcon} />
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => updateField("birthDate", e.target.value)}
                        className={styles.inputBase}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {step === "details" && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={styles.stepContent}
              >
                <div className={styles.sectionTitle}>
                  <CreditCard className="h-4 w-4" />
                  <span>Data Diri & Pendidikan</span>
                </div>

                <div className={styles.inputHalfGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>NIS / NIP</label>
                    <div className={styles.inputWrapper}>
                      <CreditCard className={styles.inputIcon} />
                      <input
                        type="text"
                        value={formData.identityNumber}
                        onChange={(e) => updateField("identityNumber", e.target.value)}
                        placeholder="Nomor induk siswa"
                        className={styles.inputBase}
                      />
                    </div>
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Nomor Telepon</label>
                    <div className={styles.inputWrapper}>
                      <Phone className={styles.inputIcon} />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateField("phone", e.target.value)}
                        placeholder="08xxx"
                        className={styles.inputBase}
                      />
                    </div>
                  </div>
                </div>

                <div className={cn(styles.formField, "relative")} ref={dropdownRef}>
                  <label className={styles.label}>Jurusan / Program Studi</label>
                  <div className={styles.inputWrapper}>
                    <Building2 className={styles.inputIcon} />
                    <input
                      type="text"
                      value={jurusanInput}
                      onChange={(e) => {
                        setJurusanInput(e.target.value);
                        updateField("jurusan", e.target.value);
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Ketik atau pilih jurusan"
                      className={styles.inputBase}
                    />
                    <button
                      type="button"
                      onClick={() => setShowDropdown(!showDropdown)}
                      className={styles.dropdownToggle}
                    >
                      <ChevronDown className={cn("h-4 w-4", showDropdown && "rotate-180")} />
                    </button>
                  </div>
                  {showDropdown && (
                    <div className={styles.dropdown}>
                      {filteredPrograms.length > 0 ? (
                        filteredPrograms.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => selectJurusan(p.nama)}
                            className={cn(
                              styles.dropdownItem,
                              jurusanInput === p.nama && styles.dropdownActive,
                            )}
                          >
                            {p.nama}
                          </button>
                        ))
                      ) : (
                        <p className={styles.dropdownEmpty}>
                          Jurusan baru: &ldquo;{jurusanInput}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className={styles.inputHalfGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Kelas</label>
                    <div className={styles.inputWrapper}>
                      <GraduationCap className={styles.inputIcon} />
                      <select value={formData.kelas} onChange={(e) => updateField("kelas", e.target.value)}
                        className={styles.inputBase} style={{ paddingLeft: "2.25rem" }}
                      >
                        <option value="">Pilih kelas</option>
                        {classList.map((c) => <option key={c.id} value={c.nama}>{c.nama}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Alamat</label>
                  <div className={styles.inputWrapper}>
                    <MapPin className={styles.inputIconTop} />
                    <textarea
                      value={formData.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder="Alamat lengkap siswa..."
                      rows={2}
                      className={cn(styles.inputBase, styles.textareaBase)}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={styles.stepContent}
              >
                <div className={styles.sectionTitle}>
                  <GraduationCap className="h-4 w-4" />
                  <span>Konfirmasi Data</span>
                </div>

                <div className={styles.confirmCard}>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Nama</span>
                    <span className={styles.confirmValue}>{formData.fullName || "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Email</span>
                    <span className={styles.confirmValue}>{formData.email || "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Password</span>
                    <span className={styles.confirmValue}>{"•".repeat(formData.password.length)}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Jenis Kelamin</span>
                    <span className={styles.confirmValue}>{formData.gender === "L" ? "Laki-laki" : formData.gender === "P" ? "Perempuan" : "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Tanggal Lahir</span>
                    <span className={styles.confirmValue}>{formData.birthDate || "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>NIS/NIP</span>
                    <span className={styles.confirmValue}>{formData.identityNumber || "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Telepon</span>
                    <span className={styles.confirmValue}>{formData.phone || "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Jurusan</span>
                    <span className={styles.confirmValue}>{formData.jurusan || "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Kelas</span>
                    <span className={styles.confirmValue}>{formData.kelas || "-"}</span>
                  </div>
                  <div className={styles.confirmRow}>
                    <span className={styles.confirmLabel}>Alamat</span>
                    <span className={styles.confirmValue}>{formData.address || "-"}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className={styles.errorText}>{error}</p>}
          {success && <p className={styles.successText}>{success}</p>}

          <div className={styles.btnGroup}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            {step !== "account" && (
              <Button type="button" variant="ghost" onClick={prevStep}>
                Kembali
              </Button>
            )}
            {step !== "confirm" ? (
              <Button type="button" onClick={nextStep} disabled={!canProceed(step)}>
                Selanjutnya
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Simpan Siswa
              </Button>
            )}
          </div>
        </form>
      </Modal>
    </>
  );
}
