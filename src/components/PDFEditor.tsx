"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { PDFViewerEngine } from "@/lib/pdf/pdfViewer";
import { AnnotationCanvas } from "@/components/AnnotationCanvas";
import type { PDFPageInfo } from "@/lib/pdf/pdfViewer";

interface Props {
  pdfUrl: string | null;
  title: string;
  onClose: () => void;
  onExportPdf?: (pdfBytes: Uint8Array) => void;
  onExportAnnotation?: (imageData: string) => void;
  studentName?: string;
}

export function PDFEditor({ pdfUrl, title, onClose, onExportPdf, onExportAnnotation, studentName }: Props) {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PDFPageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfEngine] = useState(() => new PDFViewerEngine());
  const [pageDataUrl, setPageDataUrl] = useState<string | null>(null);
  const [showAnnotation, setShowAnnotation] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadPdf = useCallback(async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const pageInfos = await pdfEngine.load(url);
      setPages(pageInfos);
      setCurrentPage(1);
      await renderCurrentPage(url);
    } catch (e: any) {
      setError(e.message || "Gagal memuat PDF.");
    } finally {
      setLoading(false);
    }
  }, []);

  const renderCurrentPage = useCallback(async (_url?: string) => {
    try {
      const dataUrl = await pdfEngine.renderPageToDataURL(currentPage, scale);
      setPageDataUrl(dataUrl);
    } catch (e: any) {
      setError(e.message || "Gagal merender halaman.");
    }
  }, [currentPage, scale, pdfEngine]);

  useEffect(() => {
    if (!pdfUrl) return;
    loadPdf(pdfUrl);
    return () => {
      pdfEngine.destroy();
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (pages.length === 0) return;
    renderCurrentPage();
  }, [currentPage, scale, pages.length, renderCurrentPage]);

  const handlePrevPage = () => {
    setCurrentPage((p) => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((p) => Math.min(pages.length, p + 1));
  };

  const handleAnnotationSave = async (imageData: string) => {
    if (onExportAnnotation) {
      onExportAnnotation(imageData);
    }

    if (onExportPdf) {
      try {
        const { PDFDocument, rgb } = await import("pdf-lib");
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);

        const arrayBuffer = (await fetch(imageData).then(r => r.arrayBuffer())) as ArrayBuffer;
        const imgBytes = new Uint8Array(arrayBuffer);
        let image;
        if (imageData.startsWith("data:image/png")) {
          image = await pdfDoc.embedPng(imgBytes);
        } else {
          image = await pdfDoc.embedJpg(imgBytes);
        }

        const { width, height } = page.getSize();
        const imgAspect = image.width / image.height;
        const pageAspect = width / height;

        let drawW: number, drawH: number;
        if (imgAspect > pageAspect) {
          drawW = width;
          drawH = width / imgAspect;
        } else {
          drawH = height;
          drawW = height * imgAspect;
        }

        page.drawImage(image, {
          x: (width - drawW) / 2,
          y: (height - drawH) / 2,
          width: drawW,
          height: drawH,
        });

        if (studentName) {
          const font = await pdfDoc.embedFont("Helvetica");
          page.drawText(`Dianotasi oleh: ${studentName}`, {
            x: 50,
            y: 30,
            size: 8,
            font,
            color: rgb(0.5, 0.5, 0.55),
          });
        }

        const pdfBytes = await pdfDoc.save();
        onExportPdf(pdfBytes);
        setMessage("PDF berhasil diexport!");
      } catch (e: any) {
        setMessage("Gagal export PDF: " + (e.message || "Error"));
      }
    } else {
      setMessage("Anotasi tersimpan!");
    }

    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full mx-4 max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800 text-sm truncate">{title}</h3>
          <div className="flex items-center gap-2">
            {pages.length > 0 && (
              <span className="text-xs text-slate-500">
                Halaman {currentPage} / {pages.length}
              </span>
            )}
            <select value={scale} onChange={(e) => setScale(Number(e.target.value))}
              className="text-xs px-2 py-1 rounded border border-slate-200 bg-white text-slate-700">
              <option value={0.75}>75%</option>
              <option value={1}>100%</option>
              <option value={1.5}>150%</option>
              <option value={2}>200%</option>
            </select>
            <button onClick={() => setShowAnnotation(!showAnnotation)}
              className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${showAnnotation ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>
              {showAnnotation ? "Selesai Anotasi" : "Anotasi"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50 flex flex-col items-center gap-4">
          {loading && <p className="text-slate-400 text-sm py-8">Memuat PDF...</p>}

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-200">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 text-green-600 text-sm px-4 py-2 rounded-lg border border-green-200">
              {message}
            </div>
          )}

          {pageDataUrl && !showAnnotation && (
            <div ref={canvasContainerRef} className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
              <img
                src={pageDataUrl}
                alt={`Halaman ${currentPage}`}
                style={{ maxWidth: "100%", display: "block" }}
              />
            </div>
          )}

          {pageDataUrl && showAnnotation && (
            <div className="w-full max-w-3xl">
              <AnnotationCanvas
                width={Math.round(595.28 * scale)}
                height={Math.round(841.89 * scale)}
                onSave={handleAnnotationSave}
                pdfBackgroundUrl={pageDataUrl}
              />
            </div>
          )}

          {pages.length === 0 && !loading && !error && (
            <p className="text-slate-400 text-sm py-8">Tidak ada PDF.</p>
          )}
        </div>

        {pages.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200">
            <div className="text-xs text-slate-400">
              {pages[currentPage - 1]?.width.toFixed(0)} x {pages[currentPage - 1]?.height.toFixed(0)} px
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrevPage} disabled={currentPage <= 1}
                className="text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-40 transition-colors">
                Sebelumnya
              </button>
              <button onClick={handleNextPage} disabled={currentPage >= pages.length}
                className="text-xs px-3 py-1.5 rounded bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 disabled:opacity-40 transition-colors">
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
