"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { Loader2, FileText, History, Search, ChevronDown, X, ClipboardList, Plus, Image } from "lucide-react";
import { getSentDocuments, sendCertificate, sendPrakerinRecap } from "@/actions/documents";
import { UNSUR_NILAI_LABELS, prakerinGradeFromScore, prakerinGradeLabel, createDefaultPrakerinData, RECAP_THEMES } from "@/lib/types";
import type { PrakerinRecapData, UnsurNilai, BidangKeahlian } from "@/lib/types";
import { downloadPrakerinPdf } from "@/lib/pdf/prakerinPdfGenerator";
import { getMyStudents } from "@/actions/student-mentors";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import styles from "@/styles/pages/dashboard/admin/SertifikatRekap.module.css";

type Tab = "certificate" | "prakerin" | "history";

function StudentSelect({
  students,
  value,
  onChange,
  placeholder,
}: {
  students: { id: string; fullName: string; kelas: string | null; identityNumber: string | null; instansi: string | null; jurusanId: string | null; studyProgramName: string | null }[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.kelas?.toLowerCase().includes(q) ||
        s.identityNumber?.toLowerCase().includes(q),
    );
  }, [students, search]);
  const selected = students.find((s) => s.id === value);

  return (
    <div className={styles.selectWrapper}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${styles.selectTrigger} ${open ? styles.selectTriggerActive : ""}`}
      >
        {selected ? (
          <span className={styles.selectValue}>
            {selected.fullName}
            {selected.kelas && <span className={styles.selectBadge}>{selected.kelas}</span>}
          </span>
        ) : (
          <span className={styles.selectPlaceholder}>{placeholder || "Pilih siswa..."}</span>
        )}
        <ChevronDown className={`${styles.selectChevron} ${open ? styles.selectChevronOpen : ""}`} />
      </button>
      {open && (
        <div className={styles.selectDropdown}>
          <div className={styles.selectSearchWrapper}>
            <Search className={styles.selectSearchIcon} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, kelas, atau NIS..."
              className={styles.selectSearchInput}
              autoFocus
            />
          </div>
          <div className={styles.selectOptions}>
            {filtered.length === 0 ? (
              <div className={styles.selectEmpty}>Tidak ditemukan</div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    onChange(s.id);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`${styles.selectOption} ${value === s.id ? styles.selectOptionActive : ""}`}
                >
                  <span>{s.fullName}</span>
                  <span className={styles.selectOptionMeta}>
                    {s.kelas && `${s.kelas}`}
                    {s.identityNumber && ` · ${s.identityNumber}`}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PembimbingSertifikatRekapPage() {
  const [tab, setTab] = useState<Tab>("prakerin");
  const [students, setStudents] = useState<{ id: string; fullName: string; kelas: string | null; identityNumber: string | null; instansi: string | null; jurusanId: string | null; studyProgramName: string | null }[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];

  // Certificate form
  const [certStudentId, setCertStudentId] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  // Prakerin recap form
  const [prakerinStudentId, setPrakerinStudentId] = useState("");
  const [prakerin, setPrakerin] = useState<PrakerinRecapData>(createDefaultPrakerinData());
  const [prakerinFile, setPrakerinFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<PrakerinRecapData | null>(null);
  const [recapTheme, setRecapTheme] = useState<string>("navy");
  const [studentSearch, setStudentSearch] = useState("");

  // Auto-fill identitas saat pilih siswa
  const handlePrakerinStudentChange = useCallback((id: string) => {
    setPrakerinStudentId(id);
    const s = students.find(st => st.id === id);
    if (s) {
      setPrakerin(prev => ({
        ...prev,
        studentName: s.fullName,
        nis: s.identityNumber || "",
        kelas: s.kelas || "",
        industri: s.instansi || "",
        programKeahlian: s.studyProgramName || "",
      }));
    }
  }, [students]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, h] = await Promise.all([getMyStudents(), getSentDocuments()]);
      setStudents(s.map((st: any) => ({
        id: st.id,
        fullName: st.fullName,
        kelas: st.kelas,
        identityNumber: st.identityNumber,
        instansi: st.instansi || null,
        jurusanId: null,
        studyProgramName: st.studyProgramName || null,
      })));
      setHistory(h);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("student_documents_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_documents" }, () => {
        loadData();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const showMessage = useCallback((type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  const formatDate = useCallback((d: string) => {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  }, []);

  // ─── Prakerin Handlers ────────────────────────────────
  const updatePrakerinField = useCallback((field: keyof PrakerinRecapData, value: string) => {
    setPrakerin((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateUnsurNilai = useCallback((idx: number, score: number) => {
    setPrakerin((prev) => {
      const updated = [...prev.unsurNilai];
      const s = Math.min(100, Math.max(0, Math.round(score) || 0));
      updated[idx] = { ...updated[idx], score: s };
      return { ...prev, unsurNilai: updated };
    });
  }, []);

  const updateBidangKeahlian = useCallback((idx: number, field: keyof BidangKeahlian, value: string | number) => {
    setPrakerin((prev) => {
      const updated = [...prev.bidangKeahlian];
      if (field === "score") {
        const numValue = typeof value === "string" ? parseInt(value) || 0 : value;
        const s = Math.min(100, Math.max(0, numValue));
        updated[idx] = { ...updated[idx], score: s, keterangan: s > 0 ? prakerinGradeLabel(s) : "" };
      } else {
        updated[idx] = { ...updated[idx], [field]: value } as any;
      }
      return { ...prev, bidangKeahlian: updated };
    });
  }, []);

  const addBidangKeahlian = useCallback(() => {
    setPrakerin((prev) => ({
      ...prev,
      bidangKeahlian: [...prev.bidangKeahlian, { name: "", score: 0, keterangan: "" }],
    }));
  }, []);

  const removeBidangKeahlian = useCallback((idx: number) => {
    setPrakerin((prev) => {
      const updated = [...prev.bidangKeahlian];
      updated.splice(idx, 1);
      return { ...prev, bidangKeahlian: updated };
    });
  }, []);

  const addUnsurNilai = useCallback(() => {
    setPrakerin((prev) => ({
      ...prev,
      unsurNilai: [...prev.unsurNilai, { name: "", score: 0 }],
    }));
  }, []);

  const updateUnsurNilaiName = useCallback((idx: number, name: string) => {
    setPrakerin((prev) => {
      const updated = [...prev.unsurNilai];
      updated[idx] = { ...updated[idx], name };
      return { ...prev, unsurNilai: updated };
    });
  }, []);

  const removeUnsurNilai = useCallback((idx: number) => {
    setPrakerin((prev) => {
      if (prev.unsurNilai.length <= 1) return prev;
      const updated = [...prev.unsurNilai];
      updated.splice(idx, 1);
      return { ...prev, unsurNilai: updated };
    });
  }, []);

  const prakerinActiveScores = useMemo(
    () => prakerin.unsurNilai.filter((u) => u.score > 0),
    [prakerin.unsurNilai],
  );
  const prakerinAvg = useMemo(
    () =>
      prakerinActiveScores.length > 0
        ? prakerinActiveScores.reduce((s, u) => s + u.score, 0) / prakerinActiveScores.length
        : 0,
    [prakerinActiveScores],
  );
  const prakerinAvgGrade = prakerinAvg > 0 ? prakerinGradeFromScore(prakerinAvg) : "-";

  const handleSendPrakerin = useCallback(() => {
    if (!prakerinStudentId) {
      showMessage("error", "Pilih siswa terlebih dahulu.");
      return;
    }
    if (prakerinActiveScores.length === 0) {
      showMessage("error", "Isi minimal 1 unsur nilai.");
      return;
    }
    setSending(() => {});
    sendPrakerinRecap(prakerinStudentId, prakerin, prakerinFile).then((result) => {
      if (result.success) {
        showMessage("success", "Rekap prakerin berhasil dikirim!");
        setPrakerinStudentId("");
        setPrakerin(createDefaultPrakerinData());
        setPrakerinFile(null);
        loadData();
      } else {
        showMessage("error", result.message);
      }
    });
  }, [prakerinStudentId, prakerin, prakerinFile, prakerinActiveScores.length, showMessage, loadData]);

  const handleDownloadPrakerinPdf = useCallback(async () => {
    if (prakerinActiveScores.length === 0) {
      showMessage("error", "Isi minimal 1 unsur nilai.");
      return;
    }
    try {
      await downloadPrakerinPdf(prakerin, recapTheme);
    } catch {
      showMessage("error", "Gagal generate PDF prakerin.");
    }
  }, [prakerin, prakerinActiveScores.length, showMessage, recapTheme]);

  // ─── Loading State ────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1>Sertifikat & Rekap Nilai</h1>
          <p>Kirim rekap penilaian prakerin ke siswa bimbingan</p>
        </div>
        <div className={styles.skeletonGrid}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.skeletonCard}>
              <div className={styles.skeletonLine} style={{ width: "40%" }} />
              <div className={styles.skeletonLine} style={{ width: "70%" }} />
              <div className={styles.skeletonLine} style={{ width: "50%" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const getHistoryBadge = (type: string) => {
    if (type === "certificate") return { tone: "warning" as const, label: "Sertifikat" };
    if (type === "prakerin_recap") return { tone: "success" as const, label: "Rekap Prakerin" };
    return { tone: "neutral" as const, label: type };
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Sertifikat & Rekap Nilai</h1>
        <p>Kirim rekap penilaian prakerin ke siswa bimbingan</p>
      </div>

      {message && (
        <div className={`${styles.toast} ${message.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className={styles.toastClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <ClipboardList className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{history.filter((h) => h.type === "prakerin_recap").length}</span>
            <span className={styles.statLabel}>Rekap Prakerin</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <FileText className={styles.statIcon} />
          <div>
            <span className={styles.statValue}>{students.length}</span>
            <span className={styles.statLabel}>Siswa Bimbingan</span>
          </div>
        </div>
      </div>

      <div className={styles.tabs}>
        <button onClick={() => setTab("certificate")} className={`${styles.tab} ${tab === "certificate" ? styles.tabActive : ""}`}>
          <Image className="h-4 w-4" />
          Upload Sertifikat
        </button>
        <button onClick={() => setTab("prakerin")} className={`${styles.tab} ${tab === "prakerin" ? styles.tabActive : ""}`}>
          <ClipboardList className="h-4 w-4" />
          Rekap Prakerin
        </button>
        <button onClick={() => setTab("history")} className={`${styles.tab} ${tab === "history" ? styles.tabActive : ""}`}>
          <History className="h-4 w-4" />
          Riwayat
        </button>
      </div>

      {tab === "certificate" && (
        <Card>
          <CardHeader title="Kirim Sertifikat PKL" />
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label>Siswa Penerima</label>
              <StudentSelect students={students} value={certStudentId} onChange={setCertStudentId} placeholder="Pilih siswa penerima..." />
            </div>
            <div className={styles.formGroup}>
              <label>File Sertifikat (PDF/Gambar)</label>
              <div className={styles.fileUploadArea}>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className={styles.fileInputHidden} id="cert-file" />
                <label htmlFor="cert-file" className={styles.fileUploadLabel}>
                  {certFile ? (
                    <div className={styles.fileSelected}>
                      <FileText className="h-5 w-5" />
                      <span>{certFile.name}</span>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCertFile(null); }} className={styles.fileRemoveBtn}><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <><FileText className="h-8 w-8 opacity-40" /><span>Klik untuk pilih file</span><span className={styles.fileHint}>PDF, JPG, PNG (maks. 10MB)</span></>
                  )}
                </label>
              </div>
            </div>
            <div className={styles.formActions}>
              <button onClick={() => {
                if (!certFile) { showMessage("error", "Pilih file sertifikat terlebih dahulu."); return; }
                setSending(() => {});
                const fd = new FormData();
                fd.append("file", certFile);
                sendCertificate(certStudentId, fd).then((result) => {
                  if (result.success) {
                    showMessage("success", "Sertifikat berhasil dikirim!");
                    setCertFile(null);
                    setCertStudentId("");
                    loadData();
                  } else { showMessage("error", result.message); }
                });
              }} disabled={sending || !certStudentId || !certFile} className={styles.btnPrimary}>
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                Kirim Sertifikat
              </button>
            </div>
          </div>
        </Card>
      )}

      {tab === "prakerin" && (
        <Card>
          <CardHeader title="Penilaian Prakerin" />
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label>Siswa Penerima</label>
              <StudentSelect students={students} value={prakerinStudentId} onChange={handlePrakerinStudentChange} placeholder="Pilih siswa bimbingan..." />
            </div>

            {/* Identity */}
            <div className={styles.prakerinSection}>
              <div className={styles.prakerinSectionTitle}>Identitas Siswa</div>
              <div className={styles.prakerinIdentityGrid}>
                <div className={styles.formGroup}>
                  <label>Nama Siswa</label>
                  <input type="text" value={prakerin.studentName} onChange={(e) => updatePrakerinField("studentName", e.target.value)} placeholder="Nama lengkap siswa" className={styles.inputDate} />
                </div>
                <div className={styles.formGroup}>
                  <label>NIS</label>
                  <input type="text" value={prakerin.nis} onChange={(e) => updatePrakerinField("nis", e.target.value)} placeholder="NIS siswa" className={styles.inputDate} />
                </div>
                <div className={styles.formGroup}>
                  <label>Kelas</label>
                  <input type="text" value={prakerin.kelas} onChange={(e) => updatePrakerinField("kelas", e.target.value)} placeholder="Kelas" className={styles.inputDate} />
                </div>
                <div className={styles.formGroup}>
                  <label>Program Keahlian</label>
                  <input type="text" value={prakerin.programKeahlian} onChange={(e) => updatePrakerinField("programKeahlian", e.target.value)} placeholder="Program keahlian" className={styles.inputDate} />
                </div>
                <div className={styles.formGroup}>
                  <label>Industri / Perusahaan</label>
                  <input type="text" value={prakerin.industri} onChange={(e) => updatePrakerinField("industri", e.target.value)} placeholder="Nama industri/perusahaan" className={styles.inputDate} />
                </div>
                <div className={styles.formGroup}>
                  <label>Periode Prakerin</label>
                  <input type="text" value={prakerin.periode} onChange={(e) => updatePrakerinField("periode", e.target.value)} placeholder="Contoh: Januari - Maret 2025" className={styles.inputDate} />
                </div>
              </div>
            </div>

            {/* Unsur Nilai */}
            <div className={styles.prakerinSection}>
              <div className={styles.prakerinSectionTitle}>Tabel Unsur Nilai</div>
              <div className={styles.prakerinTable}>
                <div className={styles.prakerinTableHeaderBidang}>
                  <span className={styles.prakerinColNo}>No</span>
                  <span className={styles.prakerinColUnsur}>Unsur Penilaian</span>
                  <span className={styles.prakerinColNilai}>Nilai Angka</span>
                  <span className={styles.prakerinColHuruf}>Nilai Huruf</span>
                  <span className={styles.prakerinColDesc}>Keterangan</span>
                  <span className={styles.prakerinColAction}>Aksi</span>
                </div>
                {prakerin.unsurNilai.map((item, idx) => {
                  const grade = item.score > 0 ? prakerinGradeFromScore(item.score) : "—";
                  const label = item.score > 0 ? prakerinGradeLabel(item.score) : "";
                  return (
                    <div key={idx} className={styles.prakerinTableRowBidang}>
                      <span className={styles.prakerinColNo}>{idx + 1}</span>
                      <span className={styles.prakerinColUnsur}>
                        <input type="text" value={item.name} onChange={(e) => updateUnsurNilaiName(idx, e.target.value)} placeholder="Nama unsur penilaian" className={styles.prakerinInput} />
                      </span>
                      <span className={styles.prakerinColNilai}>
                        <input type="number" min={0} max={100} step={1} value={item.score || ""} onChange={(e) => updateUnsurNilai(idx, parseInt(e.target.value) || 0)} className={styles.prakerinInput} placeholder="0" />
                      </span>
                      <span className={styles.prakerinColHuruf}>
                        <span className={`${styles.prakerinGrade} ${item.score >= 90 ? styles.gradeA : item.score >= 80 ? styles.gradeB : item.score >= 70 ? styles.gradeC : item.score > 0 ? styles.gradeD : ""}`}>{grade}</span>
                      </span>
                      <span className={styles.prakerinColDesc}><span className={styles.prakerinLabel}>{label}</span></span>
                      <span className={styles.prakerinColAction}>
                        <button type="button" onClick={() => removeUnsurNilai(idx)} className={styles.btnDangerSmall} aria-label="Hapus" disabled={prakerin.unsurNilai.length <= 1}><X className="h-4 w-4" /></button>
                      </span>
                    </div>
                  );
                })}
                <div className={styles.prakerinTableRowBidang}>
                  <span className={styles.prakerinColNo}></span>
                  <span className={styles.prakerinColUnsur} style={{ fontWeight: 700, textAlign: "right", paddingRight: "12px" }}>RATA-RATA</span>
                  <span className={styles.prakerinColNilai} style={{ fontWeight: 700 }}>{prakerinAvg > 0 ? Math.round(prakerinAvg) : "—"}</span>
                  <span className={styles.prakerinColHuruf}>
                    <span className={`${styles.prakerinGrade} ${prakerinAvg >= 90 ? styles.gradeA : prakerinAvg >= 80 ? styles.gradeB : prakerinAvg >= 70 ? styles.gradeC : prakerinAvg > 0 ? styles.gradeD : ""}`}>{prakerinAvgGrade}</span>
                  </span>
                  <span className={styles.prakerinColDesc} style={{ fontWeight: 500 }}>{prakerinAvg > 0 ? prakerinGradeLabel(prakerinAvg) : ""}</span>
                  <span className={styles.prakerinColAction}></span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <button type="button" onClick={addUnsurNilai} className={styles.btnOutline}><Plus className="h-4 w-4" /> Tambah Unsur Nilai</button>
              </div>
            </div>

            {/* Bidang Keahlian */}
            <div className={styles.prakerinSection}>
              <div className={styles.prakerinSectionTitle}>Bidang Keahlian Yang Dilatihkan</div>
              <div className={styles.prakerinTable}>
                <div className={styles.prakerinTableHeaderBidang}>
                  <span className={styles.prakerinColNo}>No</span>
                  <span className={styles.prakerinColUnsur}>Bidang Keahlian</span>
                  <span className={styles.prakerinColNilai}>Nilai Angka</span>
                  <span className={styles.prakerinColHuruf}>Nilai Huruf</span>
                  <span className={styles.prakerinColDesc}>Keterangan</span>
                  <span className={styles.prakerinColAction}>Aksi</span>
                </div>
                {prakerin.bidangKeahlian.map((item, idx) => {
                  const grade = item.score > 0 ? prakerinGradeFromScore(item.score) : "—";
                  const label = item.score > 0 ? prakerinGradeLabel(item.score) : "";
                  return (
                    <div key={idx} className={styles.prakerinTableRowBidang}>
                      <span className={styles.prakerinColNo}>{idx + 1}</span>
                      <span className={styles.prakerinColUnsur}>
                        <input type="text" value={item.name} onChange={(e) => updateBidangKeahlian(idx, "name", e.target.value)} placeholder="Contoh: Pemrograman Web" className={styles.prakerinInput} />
                      </span>
                      <span className={styles.prakerinColNilai}>
                        <input type="number" min={0} max={100} step={1} value={item.score || ""} onChange={(e) => updateBidangKeahlian(idx, "score", e.target.value)} className={styles.prakerinInput} placeholder="0" />
                      </span>
                      <span className={styles.prakerinColHuruf}>
                        <span className={`${styles.prakerinGrade} ${item.score >= 90 ? styles.gradeA : item.score >= 80 ? styles.gradeB : item.score >= 70 ? styles.gradeC : item.score > 0 ? styles.gradeD : ""}`}>{grade}</span>
                      </span>
                      <span className={styles.prakerinColDesc}><span className={styles.prakerinLabel}>{label}</span></span>
                      <span className={styles.prakerinColAction}>
                        <button type="button" onClick={() => removeBidangKeahlian(idx)} className={styles.btnDangerSmall} aria-label="Hapus"><X className="h-4 w-4" /></button>
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <button type="button" onClick={addBidangKeahlian} className={styles.btnOutline}><Plus className="h-4 w-4" /> Tambah Bidang Keahlian</button>
              </div>
            </div>

            {/* Skala */}
            <div className={styles.prakerinSkalaRow}>
              <div className={styles.prakerinSkalaCard}>
                <div className={styles.prakerinSkalaTitle}>Skala Penilaian Angka</div>
                <div className={styles.prakerinSkalaList}>
                  {[
                    ["90 – 100", "#DCFCE7", "#16A34A", "Sangat Baik"],
                    ["80 – 89", "#DBEAFE", "#2563EB", "Baik"],
                    ["70 – 79", "#FEF3C7", "#D97706", "Cukup"],
                    ["0 – 69", "#FEE2E2", "#DC2626", "Kurang"],
                  ].map(([range, bg, color, label]) => (
                    <div key={range} className={styles.prakerinSkalaItem}>
                      <span className={styles.skalaRange} style={{ background: bg as string, color: color as string }}>{range}</span>
                      <span>= {label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className={styles.prakerinSkalaCard}>
                <div className={styles.prakerinSkalaTitle}>Skala Penilaian Huruf</div>
                <div className={styles.prakerinSkalaList}>
                  {[
                    ["A", "#DCFCE7", "#16A34A", "Sangat Baik (90 – 100)"],
                    ["B", "#DBEAFE", "#2563EB", "Baik (80 – 89)"],
                    ["C", "#FEF3C7", "#D97706", "Cukup (70 – 79)"],
                    ["D", "#FEE2E2", "#DC2626", "Kurang (0 – 69)"],
                  ].map(([grade, bg, color, label]) => (
                    <div key={grade} className={styles.prakerinSkalaItem}>
                      <span className={styles.skalaRange} style={{ background: bg as string, color: color as string }}>{grade}</span>
                      <span>= {label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Tema */}
            <div className={styles.prakerinSection}>
              <div className={styles.prakerinSectionTitle}>Tema Warna Tabel</div>
              <div style={{ padding: "1rem", display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {Object.entries(RECAP_THEMES).map(([key, theme]) => (
                  <button key={key} type="button" onClick={() => setRecapTheme(key)} style={{
                    display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", borderRadius: "0.5rem",
                    border: recapTheme === key ? `2px solid ${theme.colors.accent}` : "1px solid #CBD5E1",
                    background: recapTheme === key ? "#F8FAFC" : "#fff", cursor: "pointer", fontSize: "0.8125rem", fontWeight: 500, color: "#1E293B",
                    transition: "all 0.15s", minHeight: "36px",
                  }}>
                    <span style={{ display: "flex", gap: "2px" }}>
                      <span style={{ width: "16px", height: "16px", borderRadius: "3px", background: theme.colors.headerBg }} />
                      <span style={{ width: "16px", height: "16px", borderRadius: "3px", background: theme.colors.rowEven }} />
                    </span>
                    {theme.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catatan & File */}
            <div className={styles.formRow2}>
              <div className={styles.formGroup}>
                <label>Tanggal Mulai PKL</label>
                <input type="date" value={prakerin.pklStartDate} onChange={(e) => updatePrakerinField("pklStartDate", e.target.value)} className={styles.inputDate} />
              </div>
              <div className={styles.formGroup}>
                <label>Tanggal Selesai PKL</label>
                <input type="date" value={prakerin.pklEndDate} onChange={(e) => updatePrakerinField("pklEndDate", e.target.value)} className={styles.inputDate} />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label>Catatan (opsional)</label>
              <textarea value={prakerin.notes} onChange={(e) => updatePrakerinField("notes", e.target.value)} placeholder="Catatan tambahan..." rows={2} className={styles.textarea} />
            </div>

            {/* TTD & NIP */}
            <div className={styles.prakerinSection}>
              <div className={styles.prakerinSectionTitle}>Tanda Tangan & NIP</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", padding: "1rem" }}>
                <div style={{ padding: "0.75rem", border: "1px solid #E2E8F0", borderRadius: "0.5rem", background: "#FAFAFA" }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.625rem", paddingBottom: "0.375rem", borderBottom: "2px solid #0F172A" }}>PEMBIMBING SEKOLAH</div>
                  <div className={styles.formGroup}><label>Nama</label><input type="text" value={prakerin.pembimbingSekolahNama} onChange={(e) => updatePrakerinField("pembimbingSekolahNama", e.target.value)} placeholder="Nama lengkap" className={styles.inputDate} /></div>
                  <div className={styles.formGroup} style={{ marginTop: "0.5rem" }}><label>NIP</label><input type="text" value={prakerin.pembimbingSekolahNip} onChange={(e) => updatePrakerinField("pembimbingSekolahNip", e.target.value)} placeholder="NIP" className={styles.inputDate} /></div>
                  <div className={styles.formGroup} style={{ marginTop: "0.5rem" }}>
                    <label>Foto Tanda Tangan</label>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = () => updatePrakerinField("pembimbingSekolahTtd", r.result as string); r.readAsDataURL(file); }
                    }} className={styles.inputDate} style={{ padding: "0.375rem" }} />
                    {prakerin.pembimbingSekolahTtd && <div style={{ marginTop: "0.375rem", borderRadius: "0.375rem", overflow: "hidden", border: "1px solid #E2E8F0", width: "120px", height: "60px", background: "#F8FAFC" }}><img src={prakerin.pembimbingSekolahTtd} alt="TTD" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>}
                  </div>
                </div>
                <div style={{ padding: "0.75rem", border: "1px solid #E2E8F0", borderRadius: "0.5rem", background: "#FAFAFA" }}>
                  <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#0F172A", marginBottom: "0.625rem", paddingBottom: "0.375rem", borderBottom: "2px solid #0F172A" }}>PEMBIMBING INDUSTRI</div>
                  <div className={styles.formGroup}><label>Nama</label><input type="text" value={prakerin.pembimbingIndustriNama} onChange={(e) => updatePrakerinField("pembimbingIndustriNama", e.target.value)} placeholder="Nama lengkap" className={styles.inputDate} /></div>
                  <div className={styles.formGroup} style={{ marginTop: "0.5rem" }}><label>NIP</label><input type="text" value={prakerin.pembimbingIndustriNip} onChange={(e) => updatePrakerinField("pembimbingIndustriNip", e.target.value)} placeholder="NIP" className={styles.inputDate} /></div>
                  <div className={styles.formGroup} style={{ marginTop: "0.5rem" }}>
                    <label>Foto Tanda Tangan</label>
                    <input type="file" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onload = () => updatePrakerinField("pembimbingIndustriTtd", r.result as string); r.readAsDataURL(file); }
                    }} className={styles.inputDate} style={{ padding: "0.375rem" }} />
                    {prakerin.pembimbingIndustriTtd && <div style={{ marginTop: "0.375rem", borderRadius: "0.375rem", overflow: "hidden", border: "1px solid #E2E8F0", width: "120px", height: "60px", background: "#F8FAFC" }}><img src={prakerin.pembimbingIndustriTtd} alt="TTD" style={{ width: "100%", height: "100%", objectFit: "contain" }} /></div>}
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Upload File (opsional — PDF/Gambar)</label>
              <div className={styles.fileUploadArea}>
                <input type="file" accept=".pdf,image/*" onChange={(e) => setPrakerinFile(e.target.files?.[0] || null)} className={styles.fileInputHidden} id="prakerin-file" />
                <label htmlFor="prakerin-file" className={styles.fileUploadLabel}>
                  {prakerinFile ? (
                    <div className={styles.fileSelected}>
                      <FileText className="h-5 w-5" />
                      <span>{prakerinFile.name}</span>
                      <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPrakerinFile(null); }} className={styles.fileRemoveBtn}><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <><FileText className="h-8 w-8 opacity-40" /><span>Klik untuk pilih file</span><span className={styles.fileHint}>PDF, JPG, PNG (maks. 10MB)</span></>
                  )}
                </label>
              </div>
            </div>

            <div className={styles.formActions}>
              <button onClick={() => setPreviewData(prakerin)} disabled={prakerinActiveScores.length === 0} className={styles.btnSecondary}>Pratinjau Nilai</button>
              <button onClick={handleDownloadPrakerinPdf} disabled={prakerinActiveScores.length === 0} className={styles.btnSecondary}>Download PDF</button>
              <button onClick={handleSendPrakerin} disabled={sending || !prakerinStudentId || prakerinActiveScores.length === 0} className={styles.btnPrimary}>
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                Kirim Rekap Prakerin
              </button>
            </div>
          </div>
        </Card>
      )}

      {previewData && (
        <PDFViewerModal
          url={null}
          title="Pratinjau Rekap Prakerin"
          gradeData={previewData}
          studentName={previewData.studentName}
          theme={recapTheme}
          onClose={() => setPreviewData(null)}
        />
      )}

      {tab === "history" && (
        <Card>
          <CardHeader
            title="Riwayat Pengiriman"
            action={
              <div className={styles.searchBox}>
                <Search className="h-4 w-4" />
                <input value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Cari siswa..." className={styles.searchInput} />
              </div>
            }
          />
          <div className={styles.tableWrapper}>
            {history.length === 0 ? (
              <div className={styles.empty}>
                <History className="h-12 w-12 opacity-30" />
                <p>Belum ada riwayat pengiriman.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Tipe</th>
                    <th>Siswa</th>
                    <th>File</th>
                    <th>Status</th>
                    <th>Dikirim</th>
                    <th>Kadaluarsa</th>
                  </tr>
                </thead>
                <tbody>
                  {history
                    .filter((doc) => !studentSearch || doc.studentName?.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map((doc) => {
                      const badge = getHistoryBadge(doc.type);
                      return (
                        <tr key={doc.id}>
                          <td><Badge tone={badge.tone}>{badge.label}</Badge></td>
                          <td className={styles.tableCellName}>{doc.studentName}</td>
                          <td className={styles.tableCellMuted}>{doc.fileName || "-"}</td>
                          <td>
                            {doc.isKept ? <Badge tone="success">Disimpan</Badge> : doc.isRead ? <Badge tone="sky">Dibaca</Badge> : <Badge tone="warning">Belum dibaca</Badge>}
                          </td>
                          <td className={styles.tableCellMuted}>{formatDate(doc.createdAt)}</td>
                          <td className={styles.tableCellMuted}>{formatDate(doc.expiresAt)}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
