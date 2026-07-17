"use client";

import { useRef, useState, useEffect } from "react";
import type { PrakerinRecapData } from "@/lib/types";

interface Props {
  url: string | null;
  title: string;
  onClose: () => void;
  gradeData?: any;
  studentName?: string;
  fileName?: string;
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

export function PDFViewerModal({ url, title, onClose, gradeData, studentName, fileName }: Props) {
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
          .identity { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 0.85rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
          th, td { padding: 0.5rem; border: 1px solid #CBD5E1; text-align: left; font-size: 0.85rem; }
          th { background: #1E3A5F; color: #fff; font-weight: 600; }
          tr:nth-child(even) td { background: #F8FAFC; }
          .notes { margin-top: 1.5rem; padding: 1rem; background: #F1F5F9; border-radius: 0.5rem; font-size: 0.85rem; }
          .footer { margin-top: 2rem; font-size: 0.75rem; color: #94A3B8; }
          .grade-badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-weight: bold; font-size: 0.8rem; }
        </style></head><body>
        <h1>${title}</h1>
        <div class="identity">
          <div><strong>Nama:</strong> ${data.studentName || ""}</div>
          <div><strong>NIS:</strong> ${data.nis || ""}</div>
          <div><strong>Kelas:</strong> ${data.kelas || ""}</div>
          <div><strong>Program Keahlian:</strong> ${data.programKeahlian || ""}</div>
          <div><strong>Industri:</strong> ${data.industri || ""}</div>
          <div><strong>Periode:</strong> ${data.periode || ""}</div>
        </div>
        <h3 style="margin-bottom: 0.5rem;">Tabel Unsur Nilai</h3>
        <table><thead><tr><th>No</th><th>Unsur Penilaian</th><th>Nilai Angka</th><th>Nilai Huruf</th><th>Keterangan</th></tr></thead><tbody>
        ${data.unsurNilai.map((u, i) => {
          const grade = u.score >= 9 ? "A" : u.score >= 8 ? "B" : u.score >= 7 ? "C" : u.score > 0 ? "D" : "-";
          const label = u.score >= 9 ? "Sangat Baik" : u.score >= 8 ? "Baik" : u.score >= 7 ? "Cukup" : u.score > 0 ? "Kurang" : "";
          return `<tr><td>${i + 1}</td><td>${u.name}</td><td>${u.score > 0 ? u.score.toFixed(1) : "-"}</td><td><span class="grade-badge">${grade}</span></td><td>${label}</td></tr>`;
        }).join("")}
        </tbody></table>
        <h3 style="margin-bottom: 0.5rem;">Bidang Keahlian Yang Dilatihkan</h3>
        <table><thead><tr><th>No</th><th>Bidang Keahlian</th><th>Keterangan</th></tr></thead><tbody>
        ${data.bidangKeahlian.map((b, i) => `<tr><td>${i + 1}</td><td>${b.name || "-"}</td><td>${b.keterangan || "-"}</td></tr>`).join("")}
        </tbody></table>
        ${data.notes ? `<div class="notes"><strong>Catatan:</strong><br>${data.notes}</div>` : ""}
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
            <div ref={gradePrintRef} className="w-full max-w-2xl">
              <div className="bg-white rounded-lg shadow-sm p-6">
                {isPrakerinData ? (
                  <>
                    {studentName && (
                      <p className="text-sm text-slate-500 mb-4">
                        Nama Siswa: <strong className="text-slate-800">{studentName}</strong>
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div><span className="text-slate-500">NIS:</span> <strong className="text-slate-800">{(gradeData as PrakerinRecapData).nis || "-"}</strong></div>
                      <div><span className="text-slate-500">Kelas:</span> <strong className="text-slate-800">{(gradeData as PrakerinRecapData).kelas || "-"}</strong></div>
                      <div><span className="text-slate-500">Program Keahlian:</span> <strong className="text-slate-800">{(gradeData as PrakerinRecapData).programKeahlian || "-"}</strong></div>
                      <div><span className="text-slate-500">Industri:</span> <strong className="text-slate-800">{(gradeData as PrakerinRecapData).industri || "-"}</strong></div>
                      <div className="col-span-2"><span className="text-slate-500">Periode:</span> <strong className="text-slate-800">{(gradeData as PrakerinRecapData).periode || "-"}</strong></div>
                    </div>

                    <h4 className="font-semibold text-slate-800 mb-2">Tabel Unsur Nilai</h4>
                    <table className="w-full border-collapse mb-4">
                      <thead>
                        <tr className="bg-[#1E3A5F] text-white">
                          <th className="text-left px-3 py-2 text-xs font-semibold">No</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Unsur Penilaian</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Nilai Angka</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Nilai Huruf</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(gradeData as PrakerinRecapData).unsurNilai.map((u, i) => {
                          const grade = u.score >= 9 ? "A" : u.score >= 8 ? "B" : u.score >= 7 ? "C" : u.score > 0 ? "D" : "-";
                          const label = u.score >= 9 ? "Sangat Baik" : u.score >= 8 ? "Baik" : u.score >= 7 ? "Cukup" : u.score > 0 ? "Kurang" : "";
                          return (
                            <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                              <td className="px-3 py-2 text-sm">{i + 1}</td>
                              <td className="px-3 py-2 text-sm">{u.name}</td>
                              <td className="px-3 py-2 text-sm">{u.score > 0 ? u.score.toFixed(1) : "-"}</td>
                              <td className="px-3 py-2 text-sm font-semibold">{grade}</td>
                              <td className="px-3 py-2 text-sm text-slate-500">{label}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    <h4 className="font-semibold text-slate-800 mb-2">Bidang Keahlian Yang Dilatihkan</h4>
                    <table className="w-full border-collapse mb-4">
                      <thead>
                        <tr className="bg-[#1E3A5F] text-white">
                          <th className="text-left px-3 py-2 text-xs font-semibold">No</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Bidang Keahlian</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(gradeData as PrakerinRecapData).bidangKeahlian.map((b, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                            <td className="px-3 py-2 text-sm">{i + 1}</td>
                            <td className="px-3 py-2 text-sm">{b.name || "-"}</td>
                            <td className="px-3 py-2 text-sm text-slate-500">{b.keterangan || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {(gradeData as PrakerinRecapData).notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded text-sm text-slate-600">
                        <strong>Catatan:</strong> {(gradeData as PrakerinRecapData).notes}
                      </div>
                    )}
                  </>
                ) : (
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
