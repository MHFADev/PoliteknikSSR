"use client";

import { useRef, useState } from "react";

interface Props {
  url: string | null;
  title: string;
  onClose: () => void;
  gradeData?: { subjects: { name: string; score: number; grade: string; sifat: string }[]; notes: string; pklStartDate?: string; pklEndDate?: string } | null;
  studentName?: string;
}

const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 3;

export function PDFViewerModal({ url, title, onClose, gradeData, studentName }: Props) {
  const [mode, setMode] = useState<"pdf" | "grade">(url ? "pdf" : "grade");
  const [zoom, setZoom] = useState(1);
  const gradePrintRef = useRef<HTMLDivElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
  const zoomReset = () => setZoom(1);

  const printGrade = () => {
    const win = window.open("", "_blank");
    if (!win || !gradePrintRef.current) return;
    const html = `
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
      ${(gradeData?.subjects || []).map((s) => `<tr><td>${s.name}</td><td>${s.sifat || "-"}</td><td>${s.score}</td><td><strong>${s.grade}</strong></td></tr>`).join("")}
      </tbody></table>
      ${gradeData?.notes ? `<div class="notes"><strong>Catatan:</strong><br>${gradeData.notes}</div>` : ""}
      <p class="footer">Dibuat: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</p>
      </body></html>
    `;
    win.document.write(html);
    win.document.close();
    win.print();
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
                {mode === "pdf" ? "Lihat Nilai" : "Lihat PDF"}
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
                <iframe
                  src={url}
                  className="border-0"
                  style={{
                    width: `${100 / zoom}%`,
                    height: `${65 / zoom}vh`,
                    transform: `scale(${zoom})`,
                    transformOrigin: "top left",
                  }}
                  title={title}
                />
              </div>
            </div>
          )}

          {mode === "grade" && gradeData && (
            <div ref={gradePrintRef} className="w-full max-w-2xl">
              <div className="bg-white rounded-lg shadow-sm p-6">
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
                    {gradeData.subjects.map((s, i) => (
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
              </div>
            </div>
          )}

          {!url && !gradeData && <p className="text-slate-400 text-sm">Tidak ada data.</p>}
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
          <div />
          <div className="flex gap-2">
            {url && (
              <a href={url} target="_blank" rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
              >
                Download
              </a>
            )}
            {gradeData && gradeData.subjects.length > 0 && (
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
