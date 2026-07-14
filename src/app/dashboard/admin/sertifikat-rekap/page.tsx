"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getStudents, getSentDocuments, sendCertificate, sendGradeSummary, recalculateGrade, SIFAT_OPTIONS } from "@/actions/documents";
import type { GradeSubject, GradeData } from "@/actions/documents";
import { downloadGradePdf } from "@/lib/pdf/gradePdfGenerator";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { PDFEditor } from "@/components/PDFEditor";
import { AnnotationCanvas } from "@/components/AnnotationCanvas";
import styles from "@/styles/pages/dashboard/admin/SertifikatRekap.module.css";

type Tab = "certificate" | "grade_summary" | "history";

export default function SertifikatRekapPage() {
  const [tab, setTab] = useState<Tab>("certificate");
  const [students, setStudents] = useState<{ id: string; fullName: string; kelas: string | null; identityNumber: string | null }[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Certificate form
  const [certStudentId, setCertStudentId] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);

  // Grade summary form
  const [gradeStudentId, setGradeStudentId] = useState("");
  const [gradeFile, setGradeFile] = useState<File | null>(null);
  const [subjects, setSubjects] = useState<GradeSubject[]>([]);
  const [notes, setNotes] = useState("");
  const [pklStartDate, setPklStartDate] = useState("");
  const [pklEndDate, setPklEndDate] = useState("");
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<string | null>(null);
  const [annotationData, setAnnotationData] = useState<string | null>(null);
  const [pdfEditorUrl, setPdfEditorUrl] = useState<string | null>(null);
  const [pdfEditorTitle, setPdfEditorTitle] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    const [s, h] = await Promise.all([getStudents(), getSentDocuments()]);
    setStudents(s);
    setHistory(h);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handlePreviewCertificate = () => {
    if (!certFile) {
      showMessage("error", "Pilih file sertifikat terlebih dahulu.");
      return;
    }
    const url = URL.createObjectURL(certFile);
    setPdfEditorUrl(url);
    setPdfEditorTitle(`Pratinjau Sertifikat - ${certFile.name}`);
  };

  const handleClosePdfEditor = () => {
    if (pdfEditorUrl) URL.revokeObjectURL(pdfEditorUrl);
    setPdfEditorUrl(null);
    setPdfEditorTitle("");
  };

  const handleSendCertificate = async () => {
    if (!certStudentId || !certFile) {
      showMessage("error", "Pilih siswa dan file sertifikat.");
      return;
    }
    setSending(true);
    const fd = new FormData();
    fd.append("file", certFile);
    const result = await sendCertificate(certStudentId, fd);
    setSending(false);
    if (result.success) {
      showMessage("success", "Sertifikat berhasil dikirim!");
      setCertFile(null);
      setCertStudentId("");
      loadData();
    } else {
      showMessage("error", result.message);
    }
  };

  const handleSendGrade = async () => {
    if (!gradeStudentId) {
      showMessage("error", "Pilih siswa terlebih dahulu.");
      return;
    }
    if (subjects.length === 0 && !gradeFile) {
      showMessage("error", "Tambah minimal 1 mata pelajaran atau upload file.");
      return;
    }
    setSending(true);
    const gradeData: GradeData = { subjects, notes, pklStartDate, pklEndDate };
    const result = await sendGradeSummary(gradeStudentId, gradeData, gradeFile);
    setSending(false);
    if (result.success) {
      showMessage("success", "Rekap nilai berhasil dikirim!");
      setGradeStudentId("");
      setGradeFile(null);
      setSubjects([]);
      setNotes("");
      setPklStartDate("");
      setPklEndDate("");
      loadData();
    } else {
      showMessage("error", result.message);
    }
  };

  const handleGenerateGradePdf = async () => {
    if (subjects.length === 0) {
      showMessage("error", "Tambah minimal 1 unsur nilai terlebih dahulu.");
      return;
    }
    const student = students.find((s) => s.id === gradeStudentId);
    const studentName = student?.fullName || "Siswa";
    const identityNumber = student?.identityNumber || "";
    const kelas = student?.kelas || "";
    const gradeData: GradeData = { subjects, notes, pklStartDate, pklEndDate };
    try {
      await downloadGradePdf(studentName, identityNumber, kelas, gradeData);
    } catch {
      showMessage("error", "Gagal generate PDF.");
    }
  };

  const handlePreviewGrade = () => {
    if (subjects.length === 0) {
      showMessage("error", "Tambah minimal 1 unsur nilai.");
      return;
    }
    setPreviewPdf("grade");
  };

  const handleAnnotationSave = (imageData: string) => {
    setAnnotationData(imageData);
    setShowAnnotation(false);
    showMessage("success", "Anotasi tersimpan!");
  };

  const addSubject = () => {
    setSubjects([...subjects, { name: "", score: 0, grade: "E", sifat: "Praktik" }]);
  };

  const removeSubject = (idx: number) => {
    setSubjects(subjects.filter((_, i) => i !== idx));
  };

  const updateSubject = async (idx: number, field: keyof GradeSubject, value: string | number) => {
    const updated = [...subjects];
    if (field === "name") {
      updated[idx].name = value as string;
    } else if (field === "score") {
      const score = Math.min(100, Math.max(0, Number(value) || 0));
      updated[idx].score = score;
      updated[idx].grade = await recalculateGrade(score);
    } else if (field === "grade") {
      updated[idx].grade = value as string;
    } else if (field === "sifat") {
      updated[idx].sifat = value as string;
    }
    setSubjects(updated);
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const selectedStudent = (id: string) => {
    const s = students.find((st) => st.id === id);
    return s ? `${s.fullName}${s.kelas ? ` (${s.kelas})` : ""}` : "Pilih siswa...";
  };

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <h1>Sertifikat & Rekap Nilai</h1>
          <p>Kirim sertifikat PKL dan rekap nilai ke siswa</p>
        </div>
        <Card><div className={styles.loading}>Memuat data...</div></Card>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Sertifikat & Rekap Nilai</h1>
        <p>Kirim sertifikat PKL dan rekap nilai ke siswa</p>
      </div>

      {message && (
        <div className={`${styles.toast} ${message.type === "success" ? styles.toastSuccess : styles.toastError}`}>
          {message.text}
        </div>
      )}

      <div className={styles.tabs}>
        <button onClick={() => setTab("certificate")} className={`${styles.tab} ${tab === "certificate" ? styles.tabActive : ""}`}>
          Upload Sertifikat
        </button>
        <button onClick={() => setTab("grade_summary")} className={`${styles.tab} ${tab === "grade_summary" ? styles.tabActive : ""}`}>
          Rekap Nilai
        </button>
        <button onClick={() => setTab("history")} className={`${styles.tab} ${tab === "history" ? styles.tabActive : ""}`}>
          Riwayat Kirim
        </button>
      </div>

      {tab === "certificate" && (
        <Card>
          <CardHeader title="Kirim Sertifikat PKL" />
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label>Siswa Penerima</label>
              <select value={certStudentId} onChange={(e) => setCertStudentId(e.target.value)} className={styles.select}>
                <option value="">-- Pilih siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}{s.kelas ? ` (${s.kelas})` : ""}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>File Sertifikat (PDF)</label>
              <input type="file" accept=".pdf,image/*" onChange={(e) => setCertFile(e.target.files?.[0] || null)} className={styles.fileInput} />
              {certFile && <span className={styles.fileName}>{certFile.name}</span>}
            </div>
            <div className={styles.formActions}>
              <button onClick={handlePreviewCertificate} disabled={!certFile} className={styles.btnSecondary}>
                Pratinjau & Anotasi
              </button>
              <button onClick={handleSendCertificate} disabled={sending} className={styles.btnPrimary}>
                {sending ? "Mengirim..." : "Kirim Sertifikat"}
              </button>
            </div>
          </div>
        </Card>
      )}

      {tab === "grade_summary" && (
        <Card>
          <CardHeader title="Kirim Rekap Nilai PKL" />
          <div className={styles.formBody}>
            <div className={styles.formGroup}>
              <label>Siswa Penerima</label>
              <select value={gradeStudentId} onChange={(e) => setGradeStudentId(e.target.value)} className={styles.select}>
                <option value="">-- Pilih siswa --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName}{s.kelas ? ` (${s.kelas})` : ""}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Upload File (opsional — PDF/Gambar)</label>
              <input type="file" accept=".pdf,image/*" onChange={(e) => setGradeFile(e.target.files?.[0] || null)} className={styles.fileInput} />
              {gradeFile && <span className={styles.fileName}>{gradeFile.name}</span>}
            </div>

            <div className={styles.formGroup}>
              <label>Periode PKL</label>
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                <input
                  type="date"
                  value={pklStartDate}
                  onChange={(e) => setPklStartDate(e.target.value)}
                  className={styles.select}
                  style={{ flex: 1 }}
                />
                <span style={{ color: "#64748B", fontSize: "0.8125rem" }}>sampai</span>
                <input
                  type="date"
                  value={pklEndDate}
                  onChange={(e) => setPklEndDate(e.target.value)}
                  className={styles.select}
                  style={{ flex: 1 }}
                />
              </div>
            </div>

            <div className={styles.sectionDivider}>
              <span>Atau Edit Nilai Langsung</span>
            </div>

            <div className={styles.gradeEditor}>
              <div className={styles.gradeHeader}>
                <span className={styles.gradeColSubject}>Unsur Nilai</span>
                <span className={styles.gradeColSifat}>Sifat</span>
                <span className={styles.gradeColScore}>Skor</span>
                <span className={styles.gradeColGrade}>Nilai</span>
                <span className={styles.gradeColAction}></span>
              </div>

              {subjects.map((subj, idx) => (
                <div key={idx} className={styles.gradeRow}>
                  <input
                    type="text"
                    placeholder="Nama unsur nilai"
                    value={subj.name}
                    onChange={(e) => updateSubject(idx, "name", e.target.value)}
                    className={styles.gradeInput}
                  />
                  <select
                    value={subj.sifat}
                    onChange={(e) => updateSubject(idx, "sifat", e.target.value)}
                    className={styles.select}
                    style={{ fontSize: "0.75rem", padding: "0.375rem 0.5rem" }}
                  >
                    {SIFAT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min={0} max={100}
                    value={subj.score}
                    onChange={(e) => updateSubject(idx, "score", e.target.value)}
                    className={styles.scoreInput}
                  />
                  <input
                    type="text"
                    value={subj.grade}
                    onChange={(e) => updateSubject(idx, "grade", e.target.value)}
                    className={styles.gradeInput}
                    style={{ width: 70, textAlign: "center", fontWeight: 600 }}
                  />
                  <button onClick={() => removeSubject(idx)} className={styles.btnDangerSmall}>Hapus</button>
                </div>
              ))}

              <button onClick={addSubject} className={styles.btnOutline}>
                + Tambah Unsur Nilai
              </button>
            </div>

            <div className={styles.formGroup}>
              <label>Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tentang nilai siswa..."
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formActions}>
              <button onClick={handlePreviewGrade} disabled={subjects.length === 0} className={styles.btnOutline}>
                Pratinjau
              </button>
              <button onClick={handleGenerateGradePdf} disabled={subjects.length === 0} className={styles.btnSecondary}>
                Download PDF
              </button>
              <button onClick={() => setShowAnnotation(!showAnnotation)} className={styles.btnSecondary}>
                {showAnnotation ? "Tutup Anotasi" : "Anotasi"}
              </button>
              <button onClick={handleSendGrade} disabled={sending} className={styles.btnPrimary}>
                {sending ? "Mengirim..." : "Kirim Rekap Nilai"}
              </button>
            </div>

            {showAnnotation && gradeFile && (
              <div className={styles.annotationSection}>
                <div className={styles.sectionDivider}>
                  <span>Anotasi PDF</span>
                </div>
                {gradeFile.type === "application/pdf" ? (
                  <div className="text-sm text-slate-500 mb-2">
                    <button
                      onClick={() => {
                        const url = URL.createObjectURL(gradeFile);
                        setPdfEditorUrl(url);
                        setPdfEditorTitle(`Anotasi - ${gradeFile.name}`);
                      }}
                      className="text-blue-600 underline hover:text-blue-800"
                    >
                      Buka PDF Editor untuk anotasi lanjutan &rarr;
                    </button>
                  </div>
                ) : null}
                <AnnotationCanvas
                  width={700}
                  height={500}
                  onSave={handleAnnotationSave}
                  pdfBackgroundUrl={gradeFile ? URL.createObjectURL(gradeFile) : null}
                />
                {annotationData && (
                  <p className={styles.fileName}>Anotasi tersimpan ({Math.round(annotationData.length / 1024)} KB)</p>
                )}
              </div>
            )}
          </div>
        </Card>
      )}

      {previewPdf && (
        <PDFViewerModal
          url={null}
          title="Pratinjau Rekap Nilai"
          gradeData={{ subjects, notes }}
          studentName={students.find((s) => s.id === gradeStudentId)?.fullName}
          onClose={() => setPreviewPdf(null)}
        />
      )}

      {pdfEditorUrl && (
        <PDFEditor
          pdfUrl={pdfEditorUrl}
          title={pdfEditorTitle}
          onClose={handleClosePdfEditor}
          studentName={students.find((s) => s.id === gradeStudentId)?.fullName}
          onExportAnnotation={(data) => {
            setAnnotationData(data);
            showMessage("success", "Anotasi tersimpan!");
          }}
          onExportPdf={(bytes) => {
            const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "annotated-document.pdf";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        />
      )}

      {tab === "history" && (
        <Card>
          <CardHeader title="Riwayat Pengiriman" />
          <div className={styles.tableWrapper}>
            {history.length === 0 ? (
              <div className={styles.empty}>Belum ada pengiriman.</div>
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
                  {history.map((doc) => (
                    <tr key={doc.id}>
                      <td>
                        <Badge tone={doc.type === "certificate" ? "warning" : "sky"}>
                          {doc.type === "certificate" ? "Sertifikat" : "Rekap Nilai"}
                        </Badge>
                      </td>
                      <td>{doc.studentName}</td>
                      <td>{doc.fileName || "-"}</td>
                      <td>
                        {doc.isKept ? (
                          <Badge tone="success">Disimpan</Badge>
                        ) : doc.isRead ? (
                          <Badge tone="sky">Dibaca</Badge>
                        ) : (
                          <Badge tone="warning">Belum dibaca</Badge>
                        )}
                      </td>
                      <td className={styles.dateCell}>{formatDate(doc.createdAt)}</td>
                      <td className={styles.dateCell}>{formatDate(doc.expiresAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
