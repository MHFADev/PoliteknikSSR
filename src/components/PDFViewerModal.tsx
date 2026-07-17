"use client";

import { useRef, useState, useEffect } from "react";
import type { PrakerinRecapData, ThemeColors } from "@/lib/types";
import { RECAP_THEMES, prakerinGradeFromScore, prakerinGradeLabel } from "@/lib/types";
import { downloadPrakerinPdf } from "@/lib/pdf/prakerinPdfGenerator";

interface Props {
  url: string | null;
  title: string;
  onClose: () => void;
  gradeData?: any;
  studentName?: string;
  fileName?: string;
  theme?: string;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;
const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"];

function isImageUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return IMAGE_EXTENSIONS.some(ext => lowerUrl.includes(ext));
}

function downloadFile(url: string, filename: string) {
  const downloadUrl = `/api/download-document?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function getThemeColors(theme?: string): ThemeColors {
  return (theme && RECAP_THEMES[theme]) ? RECAP_THEMES[theme].colors : RECAP_THEMES.navy.colors;
}

export function PDFViewerModal({ url, title, onClose, gradeData, studentName, fileName, theme }: Props) {
  const [mode, setMode] = useState<"pdf" | "grade">(url ? "pdf" : "grade");
  const [zoom, setZoom] = useState(1);
  const [isImage, setIsImage] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const gradePrintRef = useRef<HTMLDivElement>(null);
  const blobRef = useRef<string | null>(null);

  useEffect(() => {
    if (!url) return;
    const isImage = isImageUrl(url);
    setIsImage(isImage);
    // Cleanup old blob
    if (blobRef.current) { URL.revokeObjectURL(blobRef.current); blobRef.current = null; setBlobUrl(null); }
    if (!isImage) {
      setLoadingPdf(true);
      const fn = fileName || title.toLowerCase().replace(/\s+/g, '-') + '.pdf';
      fetch(`/api/download-document?url=${encodeURIComponent(url)}&mode=preview&filename=${encodeURIComponent(fn)}`)
        .then(r => r.blob())
        .then(blob => {
          const b = URL.createObjectURL(blob);
          blobRef.current = b;
          setBlobUrl(b);
          setLoadingPdf(false);
        })
        .catch(() => setLoadingPdf(false));
    }
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); };
  }, [url]);

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const isPrakerinData = gradeData && 'unsurNilai' in gradeData;

  const printGrade = () => {
    const win = window.open("", "_blank");
    if (!win || !gradePrintRef.current) return;
    let html = "";
    if (isPrakerinData) {
      const data = gradeData as PrakerinRecapData;
      html = `
        <html><head><title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: auto; }
          h1 { font-size: 1.25rem; color: #1E3A5F; margin-bottom: 0.5rem; }
          .sub { font-size: 0.85rem; color: #475569; margin-bottom: 1.5rem; }
          .identity { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem; font-size: 0.9rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
          th, td { padding: 0.6rem 0.75rem; border: 1px solid #CBD5E1; text-align: left; font-size: 0.85rem; }
          th { background: #1E3A5F; color: #fff; font-weight: 600; }
          tr:nth-child(even) td { background: #F8FAFC; }
          .avg-row td { background: #EFF6FF; font-weight: 700; color: #0F172A; }
          .notes { margin-top: 1.5rem; padding: 1rem; background: #F1F5F9; border-radius: 0.5rem; font-size: 0.85rem; }
          .footer { margin-top: 2rem; font-size: 0.75rem; color: #94A3B8; }
          .grade-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: bold; font-size: 0.8rem; }
        </style></head><body>
        <h1>${title}</h1>
        <div class="identity">
          <div><strong>Nama Siswa:</strong> ${data.studentName || "-"}</div>
          <div><strong>NIS:</strong> ${data.nis || "-"}</div>
          <div><strong>Kelas:</strong> ${data.kelas || "-"}</div>
          <div><strong>Program Keahlian:</strong> ${data.programKeahlian || "-"}</div>
          <div><strong>Industri:</strong> ${data.industri || "-"}</div>
          <div><strong>Periode:</strong> ${data.periode || `${data.pklStartDate || "-"} — ${data.pklEndDate || "-"}`}</div>
        </div>
        <h3 style="margin-bottom: 0.5rem;">Tabel Unsur Nilai</h3>
        <table><thead><tr><th>No</th><th>Unsur Penilaian</th><th>Nilai Angka</th><th>Nilai Huruf</th><th>Keterangan</th></tr></thead><tbody>
        ${data.unsurNilai.map((u, i) => {
          const grade = u.score >= 90 ? "A" : u.score >= 80 ? "B" : u.score >= 70 ? "C" : u.score > 0 ? "D" : "-";
          const label = u.score >= 90 ? "Sangat Baik" : u.score >= 80 ? "Baik" : u.score >= 70 ? "Cukup" : u.score > 0 ? "Kurang" : "";
          return `<tr><td>${i + 1}</td><td>${u.name}</td><td>${u.score > 0 ? u.score : "-"}</td><td><span class="grade-badge">${grade}</span></td><td>${label}</td></tr>`;
        }).join("")}
        ${(() => {
          const aktif = data.unsurNilai.filter((u: any) => u.score > 0);
          const avg = aktif.length > 0 ? Math.round(aktif.reduce((s: number, u: any) => s + u.score, 0) / aktif.length) : 0;
          const avgGrade = avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : avg > 0 ? "D" : "-";
          const avgLabel = avg >= 90 ? "Sangat Baik" : avg >= 80 ? "Baik" : avg >= 70 ? "Cukup" : avg > 0 ? "Kurang" : "";
          return avg > 0 ? `<tr class="avg-row"><td colspan="2">RATA-RATA</td><td>${avg}</td><td><span class="grade-badge">${avgGrade}</span></td><td>${avgLabel}</td></tr>` : "";
        })()}
        </tbody></table>
        <h3 style="margin-bottom: 0.5rem;">Bidang Keahlian Yang Dilatihkan</h3>
        <table><thead><tr><th>No</th><th>Bidang Keahlian</th><th>Nilai Angka</th><th>Nilai Huruf</th><th>Keterangan</th></tr></thead><tbody>
        ${data.bidangKeahlian.map((b, i) => {
          const g = b.score >= 90 ? "A" : b.score >= 80 ? "B" : b.score >= 70 ? "C" : b.score > 0 ? "D" : "-";
          const l = b.score >= 90 ? "Sangat Baik" : b.score >= 80 ? "Baik" : b.score >= 70 ? "Cukup" : b.score > 0 ? "Kurang" : "";
          return `<tr><td>${i + 1}</td><td>${b.name || "-"}</td><td>${b.score > 0 ? b.score : "-"}</td><td><span class="grade-badge">${g}</span></td><td>${l || "-"}</td></tr>`;
        }).join("")}
        </tbody></table>
        ${data.notes ? `<div class="notes"><strong>Catatan:</strong><br>${data.notes}</div>` : ""}

        <div style="display:flex;gap:2rem;margin-top:2.5rem;justify-content:center">
          <div style="text-align:center;width:45%">
            <p style="font-size:0.8rem;color:#64748B;margin:0 0 0.25rem">Mengetahui,</p>
            <p style="font-size:0.8rem;color:#64748B;margin:0 0 0.75rem">Pembimbing Sekolah</p>
            ${data.pembimbingSekolahTtd ? `<img src="${data.pembimbingSekolahTtd}" style="height:50px;object-fit:contain;display:block;margin:0 auto 0.5rem" />` : '<div style="height:50px"></div>'}
            <hr style="border:none;border-top:1.5px solid #1E293B;width:70%;margin:0 auto 0.25rem" />
            <p style="font-size:0.85rem;font-weight:700;margin:0.25rem 0 0">${data.pembimbingSekolahNama || "_________________________"}</p>
            <p style="font-size:0.75rem;color:#64748B;margin:0">${data.pembimbingSekolahNip ? `NIP. ${data.pembimbingSekolahNip}` : "NIP. _____________________"}</p>
          </div>
          <div style="text-align:center;width:45%">
            <p style="font-size:0.8rem;color:#64748B;margin:0 0 0.25rem">Mengetahui,</p>
            <p style="font-size:0.8rem;color:#64748B;margin:0 0 0.75rem">Pembimbing Industri / Perusahaan</p>
            ${data.pembimbingIndustriTtd ? `<img src="${data.pembimbingIndustriTtd}" style="height:50px;object-fit:contain;display:block;margin:0 auto 0.5rem" />` : '<div style="height:50px"></div>'}
            <hr style="border:none;border-top:1.5px solid #1E293B;width:70%;margin:0 auto 0.25rem" />
            <p style="font-size:0.85rem;font-weight:700;margin:0.25rem 0 0">${data.pembimbingIndustriNama || "_________________________"}</p>
            <p style="font-size:0.75rem;color:#64748B;margin:0">${data.pembimbingIndustriNip ? `NIP. ${data.pembimbingIndustriNip}` : "NIP. _____________________"}</p>
          </div>
        </div>
        <p class="footer">Dibuat: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
        </body></html>
      `;
    } else {
      html = `
        <html><head><title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 2rem; max-width: 800px; margin: auto; }
          h1 { font-size: 1.25rem; color: #1E3A5F; margin-bottom: 0.5rem; }
          .sub { font-size: 0.85rem; color: #475569; margin-bottom: 1.5rem; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 0.625rem 0.75rem; border: 1px solid #CBD5E1; text-align: left; font-size: 0.875rem; }
          th { background: #1E3A5F; color: #fff; font-weight: 600; }
          tr:nth-child(even) td { background: #F8FAFC; }
          .notes { margin-top: 1.5rem; padding: 1rem; background: #F1F5F9; border-radius: 0.5rem; font-size: 0.875rem; }
          .footer { margin-top: 2rem; font-size: 0.75rem; color: #94A3B8; }
        </style></head><body>
        <h1>${title}</h1>
        ${studentName ? `<p class="sub">Nama Siswa: ${studentName}</p>` : ""}
        ${gradeData?.pklStartDate ? `<p class="sub">Periode PKL: ${new Date(gradeData.pklStartDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} — ${gradeData.pklEndDate ? new Date(gradeData.pklEndDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}</p>` : ""}
        <table><thead><tr><th>Unsur Nilai</th><th>Sifat</th><th>Skor</th><th>Nilai</th></tr></thead><tbody>
        ${((gradeData?.subjects || []) as any[]).map((s: any) => `<tr><td>${s.name}</td><td>${s.sifat || "-"}</td><td>${s.score}</td><td><strong>${s.grade}</strong></td></tr>`).join("")}
        </tbody></table>
        ${gradeData?.notes ? `<div class="notes"><strong>Catatan:</strong><br>${gradeData.notes}</div>` : ""}
        <p class="footer">Dibuat: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
        </body></html>
      `;
    }
    win.document.write(html);
    win.document.close();
    win.print();
  };

  const handleDownload = () => {
    if (url) {
      const finalFilename = fileName || title.toLowerCase().replace(/\s+/g, '-') + (isImage ? '.png' : '.pdf');
      downloadFile(url, finalFilename);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{title}</h3>
          <div className="flex items-center gap-2">
            {url && gradeData && (
              <button onClick={() => setMode(mode === "pdf" ? "grade" : "pdf")}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
              >
                {mode === "pdf" ? "Lihat Nilai" : "Lihat File"}
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50 flex flex-col items-center">
          {mode === "pdf" && url && (
            <div className="w-full flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                <button onClick={zoomOut} disabled={zoom <= ZOOM_MIN}
                  className="text-xs px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-medium">
                  -
                </button>
                <span className="text-xs font-semibold text-slate-600 min-w-[3rem] text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={zoomIn} disabled={zoom >= ZOOM_MAX}
                  className="text-xs px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-40 font-medium">
                  +
                </button>
                <button onClick={zoomReset}
                  className="text-xs px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 font-medium">
                  Reset
                </button>
              </div>
<div className="w-full overflow-auto border border-slate-200 rounded-lg bg-white shadow-sm"
                  style={{ maxHeight: "65vh" }}>
                  {loadingPdf && !isImage && (
                    <div className="flex items-center justify-center py-16 text-sm text-slate-400">Memuat PDF...</div>
                  )}
                  {isImage ? (
                  <div style={{
                    width: `${100 / zoom}%`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                    display: "flex",
                    justifyContent: "center",
                    backgroundColor: "#f8fafc"
                  }}>
                      <img
                        src={url}
                        alt={title}
                        crossOrigin="anonymous"
                        style={{
                        maxWidth: "100%",
                        maxHeight: "65vh",
                        objectFit: "contain",
                        display: "block",
                        backgroundColor: "white"
                      }}
                    />
                  </div>
                ) : (
                  <iframe
                    src={blobUrl || ""}
                    className="border-0"
                    style={{
                      width: `${100 / zoom}%`,
                      height: `${65 / zoom}vh`,
                      transform: `scale(${zoom})`,
                      transformOrigin: "top left",
                    }}
                    title={title}
                  />
                )}
              </div>
            </div>
          )}

          {mode === "grade" && gradeData && (
            <div ref={gradePrintRef} className="w-full max-w-3xl" style={{ fontFamily: "Arial, sans-serif" }}>
              <div className="bg-white rounded-lg shadow-sm p-6">
                {isPrakerinData ? (() => {
                  const tc = getThemeColors(theme);
                  const data = gradeData as PrakerinRecapData;
                  const aktif = data.unsurNilai.filter(u => u.score > 0);
                  const avg = aktif.length > 0 ? aktif.reduce((s, u) => s + u.score, 0) / aktif.length : 0;
                  return (
                    <>
                      {/* Header */}
                      <div style={{ background: tc.primary, color: tc.headerText, padding: "1.25rem 1.5rem", borderRadius: "0.5rem 0.5rem 0 0", margin: "-1.5rem -1.5rem 1.25rem -1.5rem" }}>
                        <div style={{ fontSize: "0.7rem", opacity: 0.7, marginBottom: "0.25rem" }}>POLITEKNIK SSR — SISTEM INFORMASI PRAKERIN</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700 }}>REKAP PENILAIAN PRAKERIN</div>
                      </div>

                      {/* Identitas */}
                      <div style={{ padding: "1rem", background: tc.rowEven, borderRadius: "0.5rem", marginBottom: "1.25rem", fontSize: "0.85rem", border: `1px solid ${tc.border}` }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", rowGap: "0.6rem", columnGap: "2rem" }}>
                          <div><span style={{ color: "#64748B", fontSize: "0.75rem" }}>Nama Siswa</span><div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{data.studentName || "-"}</div></div>
                          <div><span style={{ color: "#64748B", fontSize: "0.75rem" }}>NIS</span><div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{data.nis || "-"}</div></div>
                          <div><span style={{ color: "#64748B", fontSize: "0.75rem" }}>Kelas</span><div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{data.kelas || "-"}</div></div>
                          <div><span style={{ color: "#64748B", fontSize: "0.75rem" }}>Program Keahlian</span><div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{data.programKeahlian || "-"}</div></div>
                          <div><span style={{ color: "#64748B", fontSize: "0.75rem" }}>Industri</span><div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{data.industri || "-"}</div></div>
                          <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "#64748B", fontSize: "0.75rem" }}>Periode</span><div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{data.periode || `${data.pklStartDate || "-"} — ${data.pklEndDate || "-"}`}</div></div>
                        </div>
                      </div>

                      {/* Tabel Unsur Nilai */}
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: tc.primary, margin: "0 0 0.5rem 0", padding: "0.5rem 0", borderBottom: `2px solid ${tc.primary}` }}>TABEL UNSUR NILAI</h4>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                        <thead>
                          <tr style={{ background: tc.headerBg, color: tc.headerText }}>
                            <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>No</th>
                            <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Unsur Penilaian</th>
                            <th style={{ textAlign: "center", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Nilai Angka</th>
                            <th style={{ textAlign: "center", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Nilai Huruf</th>
                            <th style={{ textAlign: "center", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.unsurNilai.map((u, i) => {
                            const grade = prakerinGradeFromScore(u.score);
                            const label = prakerinGradeLabel(u.score);
                            const gradeColors = u.score >= 90 ? { bg: "#DCFCE7", text: "#16A34A" } : u.score >= 80 ? { bg: "#DBEAFE", text: "#2563EB" } : u.score >= 70 ? { bg: "#FEF3C7", text: "#D97706" } : u.score > 0 ? { bg: "#FEE2E2", text: "#DC2626" } : { bg: "#F1F5F9", text: "#94A3B8" };
                            return (
                              <tr key={i} style={{ background: i % 2 === 0 ? tc.rowEven : "#FFFFFF", borderBottom: `1px solid ${tc.border}` }}>
                                <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: "#64748B" }}>{i + 1}</td>
                                <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>{u.name}</td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", fontWeight: 700 }}>{u.score > 0 ? u.score : "-"}</td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                                  {u.score > 0 ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "50%", background: gradeColors.bg, color: gradeColors.text, fontWeight: 800, fontSize: "0.85rem", border: `2px solid ${gradeColors.text}33` }}>{grade}</span>
                                  ) : <span style={{ color: "#94A3B8" }}>-</span>}
                                </td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", color: "#64748B" }}>{label || "-"}</td>
                              </tr>
                            );
                          })}
                          {/* Rata-rata */}
                          <tr style={{ background: "#EFF6FF", borderBottom: `2px solid ${tc.primary}`, fontWeight: 700 }}>
                            <td style={{ padding: "0.6rem 0.75rem" }} colSpan={1}></td>
                            <td style={{ padding: "0.6rem 0.75rem", color: tc.primary }}>RATA-RATA</td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", color: tc.primary, fontSize: "0.95rem" }}>{avg > 0 ? Math.round(avg) : "-"}</td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "center" }}>
                              {avg > 0 ? (
                                <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "50%", background: avg >= 90 ? "#DCFCE7" : avg >= 80 ? "#DBEAFE" : avg >= 70 ? "#FEF3C7" : "#FEE2E2", color: avg >= 90 ? "#16A34A" : avg >= 80 ? "#2563EB" : avg >= 70 ? "#D97706" : "#DC2626", fontWeight: 800, fontSize: "0.85rem", border: "2px solid #FFFFFF88" }}>{prakerinGradeFromScore(avg)}</span>
                              ) : "-"}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", textAlign: "center", color: tc.primary }}>{avg > 0 ? prakerinGradeLabel(avg) : "-"}</td>
                          </tr>
                        </tbody>
                      </table>

                      {/* Tabel Bidang Keahlian */}
                      <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: tc.primary, margin: "0 0 0.5rem 0", padding: "0.5rem 0", borderBottom: `2px solid ${tc.primary}` }}>BIDANG KEAHLIAN YANG DILATIHKAN</h4>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
                        <thead>
                          <tr style={{ background: tc.headerBg, color: tc.headerText }}>
                            <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>No</th>
                            <th style={{ textAlign: "left", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Bidang Keahlian</th>
                            <th style={{ textAlign: "center", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Nilai</th>
                            <th style={{ textAlign: "center", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Grade</th>
                            <th style={{ textAlign: "center", padding: "0.6rem 0.75rem", fontWeight: 600, fontSize: "0.75rem", letterSpacing: "0.04em" }}>Keterangan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.bidangKeahlian.map((b, i) => {
                            const grade = prakerinGradeFromScore(b.score);
                            const label = prakerinGradeLabel(b.score);
                            const gradeColors = b.score >= 90 ? { bg: "#DCFCE7", text: "#16A34A" } : b.score >= 80 ? { bg: "#DBEAFE", text: "#2563EB" } : b.score >= 70 ? { bg: "#FEF3C7", text: "#D97706" } : b.score > 0 ? { bg: "#FEE2E2", text: "#DC2626" } : { bg: "#F1F5F9", text: "#94A3B8" };
                            return (
                              <tr key={i} style={{ background: i % 2 === 0 ? tc.rowEven : "#FFFFFF", borderBottom: `1px solid ${tc.border}` }}>
                                <td style={{ padding: "0.5rem 0.75rem", fontWeight: 600, color: "#64748B" }}>{i + 1}</td>
                                <td style={{ padding: "0.5rem 0.75rem", fontWeight: 500 }}>{b.name || "-"}</td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", fontWeight: 700 }}>{b.score > 0 ? b.score : "-"}</td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center" }}>
                                  {b.score > 0 ? (
                                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "30px", height: "30px", borderRadius: "50%", background: gradeColors.bg, color: gradeColors.text, fontWeight: 800, fontSize: "0.85rem", border: `2px solid ${gradeColors.text}33` }}>{grade}</span>
                                  ) : <span style={{ color: "#94A3B8" }}>-</span>}
                                </td>
                                <td style={{ padding: "0.5rem 0.75rem", textAlign: "center", color: "#64748B" }}>{label || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>

                      {data.notes && (
                        <div style={{ marginTop: "1rem", padding: "0.85rem 1rem", background: tc.rowEven, borderRadius: "0.5rem", fontSize: "0.85rem", color: "#475569", border: `1px solid ${tc.border}` }}>
                          <strong style={{ color: tc.primary }}>Catatan:</strong><br />{data.notes}
                        </div>
                      )}

                      {/* TTD & NIP */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2.5rem" }}>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "0.25rem" }}>Mengetahui,</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "0.75rem" }}>Pembimbing Sekolah</div>
                          {data.pembimbingSekolahTtd ? (
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                              <img src={data.pembimbingSekolahTtd} alt="TTD" style={{ height: "50px", objectFit: "contain" }} />
                            </div>
                          ) : (
                            <div style={{ height: "50px" }} />
                          )}
                          <div style={{ borderTop: "1.5px solid #1E293B", width: "70%", margin: "0 auto 0.25rem" }} />
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>{data.pembimbingSekolahNama || "_________________________"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{data.pembimbingSekolahNip ? `NIP. ${data.pembimbingSekolahNip}` : "NIP. _____________________"}</div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "0.25rem" }}>Mengetahui,</div>
                          <div style={{ fontSize: "0.8rem", color: "#64748B", marginBottom: "0.75rem" }}>Pembimbing Industri / Perusahaan</div>
                          {data.pembimbingIndustriTtd ? (
                            <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
                              <img src={data.pembimbingIndustriTtd} alt="TTD" style={{ height: "50px", objectFit: "contain" }} />
                            </div>
                          ) : (
                            <div style={{ height: "50px" }} />
                          )}
                          <div style={{ borderTop: "1.5px solid #1E293B", width: "70%", margin: "0 auto 0.25rem" }} />
                          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1E293B" }}>{data.pembimbingIndustriNama || "_________________________"}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>{data.pembimbingIndustriNip ? `NIP. ${data.pembimbingIndustriNip}` : "NIP. _____________________"}</div>
                        </div>
                      </div>
                    </>
                  );
                })() : (
                  <>
                    {studentName && (
                      <p className="text-sm text-slate-500 mb-4">
                        Nama Siswa: <strong className="text-slate-800">{studentName}</strong>
                      </p>
                    )}
                    {gradeData.pklStartDate && (
                      <p className="text-sm text-slate-500 mb-3">
                        Periode PKL: <strong className="text-slate-800">
                          {new Date(gradeData.pklStartDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </strong> — <strong className="text-slate-800">
                          {gradeData.pklEndDate ? new Date(gradeData.pklEndDate + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                        </strong>
                      </p>
                    )}
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-[#1E3A5F] text-white">
                          <th className="text-left px-3 py-2 text-xs font-semibold">Unsur Nilai</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Sifat</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Skor</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(gradeData.subjects as any[])?.map((s: any, i: number) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                            <td className="px-3 py-2 text-sm">{s.name}</td>
                            <td className="px-3 py-2 text-sm text-slate-500">{s.sifat || "-"}</td>
                            <td className="px-3 py-2 text-sm">{s.score}</td>
                            <td className="px-3 py-2 text-sm font-semibold">{s.grade}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {gradeData.notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded text-sm text-slate-600">
                        <strong>Catatan:</strong> {gradeData.notes}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {!url && !gradeData && <p className="text-slate-400 text-sm">Tidak ada data.</p>}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
          <div />
          <div className="flex gap-2">
            {url && (
              <button onClick={handleDownload}
                className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Download
              </button>
            )}
            {isPrakerinData && (gradeData as PrakerinRecapData).unsurNilai.some(u => u.score > 0) && (
              <button onClick={() => downloadPrakerinPdf(gradeData as PrakerinRecapData, theme)}
                className="text-xs px-3 py-1.5 rounded bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
                style={{ background: "#059669", color: "#fff" }}
              >
                Download PDF
              </button>
            )}
            {gradeData && ((isPrakerinData && (gradeData as PrakerinRecapData).unsurNilai.length > 0) || (!isPrakerinData && gradeData.subjects?.length > 0)) && (
              <button onClick={printGrade}
                className="text-xs px-3 py-1.5 rounded bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                Cetak
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
