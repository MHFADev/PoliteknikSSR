"use client";

import { useState, useEffect, useCallback } from "react";
import { getStudentDocuments, toggleKeepDocument } from "@/actions/documents";
import type { PrakerinRecapData } from "@/actions/documents";
import { PDFViewerModal } from "@/components/PDFViewerModal";
import { FileText, Image, FileDown, Eye, Trash2 } from "lucide-react";

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

export function StudentDocuments() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<Document | null>(null);

  const load = useCallback(async () => {
    const data = await getStudentDocuments();
    setDocs(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("id-ID", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const downloadFile = async (doc: Document) => {
    if (doc.fileUrl) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.fileName || "dokumen";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleKeep = async (docId: string, keep: boolean) => {
    await toggleKeepDocument(docId, keep);
    load();
  };

  if (loading) {
    return <div className="text-sm text-slate-400 py-4 text-center">Memuat dokumen...</div>;
  }

  if (docs.length === 0) {
    return (
      <div className="text-sm text-slate-400 py-8 text-center">
        Belum ada sertifikat atau rekap prakerin yang diterima.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {viewDoc && (
        <PDFViewerModal
          url={viewDoc.fileUrl}
          title={viewDoc.fileName || (viewDoc.type === "certificate" ? "Sertifikat PKL" : "Rekap Prakerin")}
          gradeData={viewDoc.gradeData}
          onClose={() => setViewDoc(null)}
        />
      )}

      {docs.map((doc) => (
        <div key={doc.id}
          className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-colors"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
            doc.type === "certificate" ? "bg-orange-100 text-orange-600" : "bg-sky-100 text-sky-600"
          }`}>
            {doc.type === "certificate" ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full ${
                doc.type === "certificate"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-sky-100 text-sky-700"
              }`}>
                {doc.type === "certificate" ? "Sertifikat" : "Rekap Prakerin"}
              </span>
              {doc.isKept && (
                <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                  Disimpan
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-slate-800 truncate mt-0.5">
              {doc.fileName || (doc.type === "certificate" ? "Sertifikat PKL" : "Rekap Prakerin")}
            </p>
            <p className="text-[0.7rem] text-slate-500">
              Diterima: {formatDate(doc.createdAt)}
              {!doc.isKept && ` · Kedaluwarsa: ${formatDate(doc.expiresAt)}`}
            </p>
          </div>

          <div className="flex gap-1.5 shrink-0">
            <button onClick={() => setViewDoc(doc)}
              className="text-xs px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium transition-colors flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Lihat
            </button>
            <button onClick={() => downloadFile(doc)}
              className="text-xs px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium transition-colors flex items-center gap-1">
              <FileDown className="h-3 w-3" />
              Download
            </button>
            {!doc.isKept ? (
              <button onClick={() => handleKeep(doc.id, true)}
                className="text-xs px-2 py-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                title="Simpan (jangan dihapus otomatis)">
                Simpan
              </button>
            ) : (
              <button onClick={() => handleKeep(doc.id, false)}
                className="text-xs px-2 py-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                title="Izinkan penghapusan otomatis">
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
