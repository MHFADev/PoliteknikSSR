"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, CalendarCheck, BookOpen, ClipboardList, BarChart3 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  exportToCSV,
  exportToExcel,
  formatDateID,
  formatDateTimeID,
  formatStatus,
  type ExportColumn,
} from "@/lib/export-data";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import styles from "@/styles/pages/dashboard/admin/Export.module.css";

type FormatType = "csv" | "xlsx";

export default function AdminExportPage() {
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [format, setFormat] = useState<FormatType>("xlsx");
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  function triggerExport<T extends Record<string, unknown>>(
    rows: T[],
    options: {
      columns: ExportColumn<T>[];
      title: string;
      subtitle?: string;
      sheetName?: string;
      csvFilename: string;
      xlsxFilename: string;
    }
  ) {
    if (format === "xlsx") {
      exportToExcel(rows, options, options.xlsxFilename);
    } else {
      exportToCSV(rows, options, options.csvFilename);
    }
  }

  // ── Export Presensi ──────────────────────────────────────────────────────
  async function exportAttendance() {
    setLoadingKey("attendance");
    const supabase = createClient();

    let query = supabase
      .from("attendance_records")
      .select("scanned_at, status, student:profiles!attendance_records_student_id_fkey(full_name, identity_number, kelas, study_programs!profiles_jurusan_id_fkey(nama))")
      .gte("scanned_at", `${dateFrom}T00:00:00`)
      .lte("scanned_at", `${dateTo}T23:59:59`)
      .order("scanned_at", { ascending: false });

    const { data } = await query;

    const rows = (data ?? []).map((r: any) => ({
      tanggal: r.scanned_at,
      nama: r.student?.full_name ?? "-",
      nis: r.student?.identity_number ?? "-",
      kelas: r.student?.kelas ?? "-",
      jurusan: r.student?.study_programs?.nama ?? "-",
      status: r.status,
    }));

    const cols: ExportColumn<(typeof rows)[0]>[] = [
      { key: "tanggal", label: "Tanggal & Waktu", width: 22, format: (_, r) => formatDateTimeID(r.tanggal) },
      { key: "nama", label: "Nama Siswa", width: 24 },
      { key: "nis", label: "NIS", width: 16 },
      { key: "kelas", label: "Kelas", width: 12 },
      { key: "jurusan", label: "Program Studi", width: 20 },
      { key: "status", label: "Status", width: 14, format: (_, r) => formatStatus(r.status) },
    ];

    triggerExport(rows, {
      columns: cols,
      title: "LAPORAN KEHADIRAN PKL",
      subtitle: `Periode: ${formatDateID(dateFrom + "T00:00:00")} — ${formatDateID(dateTo + "T00:00:00")}`,
      sheetName: "Kehadiran",
      csvFilename: `presensi-${dateFrom}-sd-${dateTo}.csv`,
      xlsxFilename: `presensi-${dateFrom}-sd-${dateTo}.xlsx`,
    });
    setLoadingKey(null);
  }

  // ── Export Izin ──────────────────────────────────────────────────────────
  async function exportLeave() {
    setLoadingKey("leave");
    const supabase = createClient();

    const { data } = await supabase
      .from("leave_requests")
      .select("created_at, type, status, start_date, end_date, reason, student:profiles!leave_requests_student_id_fkey(full_name, identity_number, kelas)")
      .gte("created_at", `${dateFrom}T00:00:00`)
      .lte("created_at", `${dateTo}T23:59:59`)
      .order("created_at", { ascending: false });

    const rows = (data ?? []).map((r: any) => ({
      diajukan: r.created_at,
      nama: r.student?.full_name ?? "-",
      nis: r.student?.identity_number ?? "-",
      kelas: r.student?.kelas ?? "-",
      jenis: r.type,
      mulai: r.start_date,
      selesai: r.end_date,
      status: r.status,
      alasan: r.reason ?? "-",
    }));

    const cols: ExportColumn<(typeof rows)[0]>[] = [
      { key: "diajukan", label: "Tanggal Pengajuan", width: 20, format: (_, r) => formatDateID(r.diajukan) },
      { key: "nama", label: "Nama Siswa", width: 24 },
      { key: "nis", label: "NIS", width: 16 },
      { key: "kelas", label: "Kelas", width: 12 },
      { key: "jenis", label: "Jenis", width: 12, format: (_, r) => formatStatus(r.jenis) },
      { key: "mulai", label: "Tanggal Mulai", width: 16, format: (_, r) => formatDateID(r.mulai) },
      { key: "selesai", label: "Tanggal Selesai", width: 16, format: (_, r) => formatDateID(r.selesai) },
      { key: "status", label: "Status", width: 14, format: (_, r) => formatStatus(r.status) },
      { key: "alasan", label: "Alasan", width: 36 },
    ];

    triggerExport(rows, {
      columns: cols,
      title: "LAPORAN PENGAJUAN IZIN / SAKIT",
      subtitle: `Periode: ${formatDateID(dateFrom + "T00:00:00")} — ${formatDateID(dateTo + "T00:00:00")}`,
      sheetName: "Pengajuan Izin",
      csvFilename: `izin-${dateFrom}-sd-${dateTo}.csv`,
      xlsxFilename: `izin-${dateFrom}-sd-${dateTo}.xlsx`,
    });
    setLoadingKey(null);
  }

  // ── Export Logbook ───────────────────────────────────────────────────────
  async function exportLogbook() {
    setLoadingKey("logbook");
    const supabase = createClient();

    const { data } = await supabase
      .from("logbook_entries")
      .select("entry_date, content, grade, feedback, student:profiles!logbook_entries_student_id_fkey(full_name, identity_number, kelas)")
      .gte("entry_date", dateFrom)
      .lte("entry_date", dateTo)
      .order("entry_date", { ascending: false });

    const rows = (data ?? []).map((r: any) => ({
      tanggal: r.entry_date,
      nama: r.student?.full_name ?? "-",
      nis: r.student?.identity_number ?? "-",
      kelas: r.student?.kelas ?? "-",
      isi: r.content ?? "-",
      nilai: r.grade ?? "-",
      feedback: r.feedback ?? "-",
    }));

    const cols: ExportColumn<(typeof rows)[0]>[] = [
      { key: "tanggal", label: "Tanggal", width: 16, format: (_, r) => formatDateID(r.tanggal) },
      { key: "nama", label: "Nama Siswa", width: 24 },
      { key: "nis", label: "NIS", width: 16 },
      { key: "kelas", label: "Kelas", width: 12 },
      { key: "isi", label: "Isi Logbook", width: 40 },
      { key: "nilai", label: "Nilai", width: 10 },
      { key: "feedback", label: "Feedback", width: 36 },
    ];

    triggerExport(rows, {
      columns: cols,
      title: "LAPORAN LOGBOOK KEGIATAN PKL",
      subtitle: `Periode: ${formatDateID(dateFrom + "T00:00:00")} — ${formatDateID(dateTo + "T00:00:00")}`,
      sheetName: "Logbook",
      csvFilename: `logbook-${dateFrom}-sd-${dateTo}.csv`,
      xlsxFilename: `logbook-${dateFrom}-sd-${dateTo}.xlsx`,
    });
    setLoadingKey(null);
  }

  const exports = [
    {
      key: "attendance",
      label: "Kehadiran",
      desc: "Rekap absensi harian: hadir, terlambat, dan status kehadiran siswa.",
      icon: <CalendarCheck className={styles.cardIcon} />,
      accent: "blue",
      action: exportAttendance,
    },
    {
      key: "leave",
      label: "Pengajuan Izin",
      desc: "Daftar pengajuan izin, sakit, dan cuti beserta status persetujuan.",
      icon: <ClipboardList className={styles.cardIcon} />,
      accent: "amber",
      action: exportLeave,
    },
    {
      key: "logbook",
      label: "Logbook",
      desc: "Catatan kegiatan harian siswa beserta penilaian dan feedback.",
      icon: <BookOpen className={styles.cardIcon} />,
      accent: "green",
      action: exportLogbook,
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div className={styles.headerTop}>
          <div>
            <h1>Ekspor Data</h1>
            <p>Unduh data kehadiran, izin, dan logbook dalam format CSV atau Excel.</p>
          </div>
          <div className={styles.headerBadge}>
            <BarChart3 className="h-4 w-4" />
            <span>Rekap PKL</span>
          </div>
        </div>
      </div>

      {/* ── Controls Bar ── */}
      <div className={styles.controlsBar}>
        <div className={styles.dateRange}>
          <label className={styles.controlLabel}>
            <span>Dari</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={styles.dateInput}
            />
          </label>
          <span className={styles.dateSeparator}>—</span>
          <label className={styles.controlLabel}>
            <span>Sampai</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={styles.dateInput}
            />
          </label>
        </div>

        <div className={styles.formatPicker}>
          <span className={styles.controlLabel}>Format</span>
          <div className={styles.formatToggle}>
            <button
              className={`${styles.formatBtn} ${format === "xlsx" ? styles.formatBtnActive : ""}`}
              onClick={() => setFormat("xlsx")}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              className={`${styles.formatBtn} ${format === "csv" ? styles.formatBtnActive : ""}`}
              onClick={() => setFormat("csv")}
            >
              <FileText className="h-3.5 w-3.5" />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* ── Export Cards ── */}
      <div className={styles.exportGrid}>
        {exports.map((item) => (
          <Card key={item.key} className={`${styles.exportCard} ${styles[`accent-${item.accent}`]}`}>
            <div className={styles.cardHeader}>
              <div className={`${styles.cardIconWrapper} ${styles[`iconBg-${item.accent}`]}`}>
                {item.icon}
              </div>
              <div className={styles.cardInfo}>
                <h3>{item.label}</h3>
                <p>{item.desc}</p>
              </div>
            </div>
            <Button
              isLoading={loadingKey === item.key}
              onClick={item.action}
              className={styles.exportBtn}
            >
              <Download className="h-4 w-4" />
              Unduh {format === "xlsx" ? "Excel" : "CSV"}
            </Button>
          </Card>
        ))}
      </div>

      {/* ── Footer Note ── */}
      <div className={styles.footerNote}>
        <p>
          Format Excel (.xlsx) menyertakan header berwarna, auto-filter, dan freeze pane.
          Format CSV kompatibel dengan aplikasi spreadsheet lainnya.
        </p>
      </div>
    </div>
  );
}
