"use client";

import { useState, useEffect, useCallback } from "react";
import { getStudentDocuments, markAsRead, toggleKeepDocument } from "@/actions/documents";
import type { PrakerinRecapData } from "@/actions/documents";
import { PDFViewerModal } from "./PDFViewerModal";

interface Document {
  id: string;
  type: "certificate" | "prakerin_recap";
  fileUrl: string | null;
  fileName: string | null;
  gradeData: PrakerinRecapData | null;
  isRead: boolean;
  isKept: boolean;
  createdAt: string;
  expiresAt: string;
}

export function StudentDocumentPopup() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);

  const load = useCallback(async () => {
    const data = await getStudentDocuments();
    setDocs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unread = docs.filter((d) => !d.isRead);
  const visible = showAll ? docs : docs.slice(0, 1);

  if (loading || unread.length === 0) return null;

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const openDocument = async (doc: Document) => {
    await markAsRead(doc.id);
    setViewDoc(doc);
    load();
  };

  const handleKeep = async (docId: string) => {
    await toggleKeepDocument(docId, true);
    load();
  };

  return (
    <>
      {viewDoc && (
        <PDFViewerModal
          url={viewDoc.fileUrl}
          title={viewDoc.fileName || (viewDoc.type === "certificate" ? "Sertifikat PKL" : "Rekap Prakerin")}
          gradeData={viewDoc.gradeData}
          onClose={() => setViewDoc(null)}
        />
      )}

      <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowAll(!showAll)} />
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full sm:max-w-md">
        {visible.map((doc) => (
          <div key={doc.id} className="bg-white rounded-lg shadow-lg border border-blue-100 p-4 animate-slide-up">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`inline-block text-[0.65rem] font-semibold px-2 py-0.5 rounded-full mb-1 ${
                  doc.type === "certificate"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-sky-100 text-sky-700"
                }`}>
                  {doc.type === "certificate" ? "Sertifikat PKL" : "Rekap Prakerin"}
                </span>
                <h4 className="text-sm font-semibold text-slate-800">
                  {doc.fileName || (doc.type === "certificate" ? "Sertifikat PKL" : "Rekap Prakerin")}
                </h4>
                <p className="text-[0.7rem] text-slate-500 mt-0.5">
                  Dikirim: {formatDate(doc.createdAt)}
                  {!doc.isKept && ` · Berlaku hingga ${formatDate(doc.expiresAt)}`}
                </p>
              </div>
              <button onClick={() => setShowAll(!showAll)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => openDocument(doc)}
                className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-md hover:bg-blue-700 transition-colors"
              >
                {doc.fileUrl ? "Lihat & Download" : "Lihat & Cetak"}
              </button>
              {!doc.isKept && (
                <button
                  onClick={() => handleKeep(doc.id)}
                  className="px-3 py-1.5 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
                >
                  Simpan
                </button>
              )}
            </div>
          </div>
        ))}
        {docs.length > 1 && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium text-center bg-white/90 rounded-md py-1.5 shadow-sm border border-blue-100"
          >
            +{docs.length - 1} dokumen lainnya
          </button>
        )}
      </div>
    </>
  );
}
