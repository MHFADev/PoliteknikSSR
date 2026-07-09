"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { exportToCSV } from "@/lib/export-csv";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";

export default function AdminExportPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  async function exportAttendance() {
    setLoadingKey("attendance");
    const supabase = createClient();
    const { data } = await supabase
      .from("attendance_records")
      .select("scanned_at, status, student:profiles!attendance_records_student_id_fkey(full_name, identity_number)")
      .order("scanned_at", { ascending: false });

    const rows = (data ?? []).map((r: any) => ({
      tanggal: r.scanned_at,
      nama: r.student?.full_name,
      nis: r.student?.identity_number,
      status: r.status,
    }));

    exportToCSV(rows, "presensi.csv", [
      { key: "tanggal", label: "Tanggal & Jam" },
      { key: "nama", label: "Nama Siswa" },
      { key: "nis", label: "NIS" },
      { key: "status", label: "Status" },
    ]);
    setLoadingKey(null);
  }

  async function exportLeave() {
    setLoadingKey("leave");
    const supabase = createClient();
    const { data } = await supabase
      .from("leave_requests")
      .select(
        "created_at, type, status, start_date, end_date, reason, student:profiles!leave_requests_student_id_fkey(full_name, identity_number)"
      )
      .order("created_at", { ascending: false });

    const rows = (data ?? []).map((r: any) => ({
      diajukan: r.created_at,
      nama: r.student?.full_name,
      nis: r.student?.identity_number,
      jenis: r.type,
      mulai: r.start_date,
      selesai: r.end_date,
      status: r.status,
      alasan: r.reason,
    }));

    exportToCSV(rows, "pengajuan-izin.csv", [
      { key: "diajukan", label: "Tanggal Diajukan" },
      { key: "nama", label: "Nama Siswa" },
      { key: "nis", label: "NIS" },
      { key: "jenis", label: "Jenis" },
      { key: "mulai", label: "Tanggal Mulai" },
      { key: "selesai", label: "Tanggal Selesai" },
      { key: "status", label: "Status" },
      { key: "alasan", label: "Alasan" },
    ]);
    setLoadingKey(null);
  }

  async function exportLogbook() {
    setLoadingKey("logbook");
    const supabase = createClient();
    const { data } = await supabase
      .from("logbook_entries")
      .select(
        "entry_date, content, grade, feedback, student:profiles!logbook_entries_student_id_fkey(full_name, identity_number)"
      )
      .order("entry_date", { ascending: false });

    const rows = (data ?? []).map((r: any) => ({
      tanggal: r.entry_date,
      nama: r.student?.full_name,
      nis: r.student?.identity_number,
      isi: r.content,
      nilai: r.grade,
      feedback: r.feedback,
    }));

    exportToCSV(rows, "logbook.csv", [
      { key: "tanggal", label: "Tanggal" },
      { key: "nama", label: "Nama Siswa" },
      { key: "nis", label: "NIS" },
      { key: "isi", label: "Isi Logbook" },
      { key: "nilai", label: "Nilai" },
      { key: "feedback", label: "Feedback" },
    ]);
    setLoadingKey(null);
  }

  const exports = [
    { key: "attendance", label: "Ekspor Data Presensi", action: exportAttendance },
    { key: "leave", label: "Ekspor Data Izin", action: exportLeave },
    { key: "logbook", label: "Ekspor Data Logbook", action: exportLogbook },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Ekspor Data</h1>
        <p className="text-sm text-mist-dim">Unduh data dalam format CSV untuk keperluan rekap & laporan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {exports.map((item) => (
          <Card key={item.key} className="flex flex-col items-start gap-3">
            <CardHeader title={item.label} />
            <Button isLoading={loadingKey === item.key} onClick={item.action}>
              <Download className="h-4 w-4" /> Unduh CSV
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
