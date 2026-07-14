"use client";

import ExcelJS from "exceljs";

export type ExportColumn<T> = {
  key: keyof T;
  label: string;
  width?: number;
  format?: (value: unknown, row: T) => string;
};

export type ExportOptions<T> = {
  columns: ExportColumn<T>[];
  title: string;
  subtitle?: string;
  sheetName?: string;
};

// ─── Formatters ──────────────────────────────────────────────────────────────

export function formatDateID(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTimeID(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatStatus(status: string): string {
  const map: Record<string, string> = {
    hadir: "Hadir",
    telat: "Terlambat",
    izin: "Izin",
    sakit: "Sakit",
    cuti: "Cuti",
    pending: "Menunggu",
    approved: "Disetujui",
    rejected: "Ditolak",
  };
  return map[status?.toLowerCase()] ?? status ?? "-";
}

// ─── CSV Export ──────────────────────────────────────────────────────────────

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  options: ExportOptions<T>,
  filename: string
) {
  if (rows.length === 0) return;

  const { columns, title, subtitle } = options;

  // ── Build rows with formatted values ──
  const formattedRows = rows.map((row) =>
    columns.map((col) => {
      const raw = row[col.key];
      return col.format ? col.format(raw, row) : String(raw ?? "-");
    })
  );

  // ── Build CSV string with report header ──
  const lines: string[] = [];

  // Report header
  lines.push(escapeCSV(title));
  if (subtitle) lines.push(escapeCSV(subtitle));
  lines.push(escapeCSV(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`));
  lines.push("");

  // Column headers
  lines.push(columns.map((col) => escapeCSV(col.label)).join(","));

  // Data rows
  for (const row of formattedRows) {
    lines.push(row.map(escapeCSV).join(","));
  }

  // Summary
  lines.push("");
  lines.push(escapeCSV(`Total: ${rows.length} data`));

  const csvContent = lines.join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  triggerDownload(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

// ─── Excel Export ────────────────────────────────────────────────────────────

export async function exportToExcel<T extends Record<string, unknown>>(
  rows: T[],
  options: ExportOptions<T>,
  filename: string
) {
  if (rows.length === 0) return;

  const { columns, title, subtitle, sheetName } = options;

  const workbook = new ExcelJS.Workbook();
  workbook.created = new Date();
  workbook.creator = "Politeknik SSR Dashboard";

  const sheet = workbook.addWorksheet(sheetName ?? "Data", {
    pageSetup: {
      orientation: "landscape",
      paperSize: 9, // A4
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
  });

  // ── Title section ──
  const titleRow = sheet.addRow([title]);
  sheet.mergeCells(titleRow.number, 1, titleRow.number, columns.length);
  const titleCell = titleRow.getCell(1);
  titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FF1E293B" } };
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  titleRow.height = 30;

  if (subtitle) {
    const subRow = sheet.addRow([subtitle]);
    sheet.mergeCells(subRow.number, 1, subRow.number, columns.length);
    const subCell = subRow.getCell(1);
    subCell.font = { name: "Calibri", size: 10, color: { argb: "FF64748B" } };
    subCell.alignment = { horizontal: "left" };
  }

  // Print date
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateRow = sheet.addRow([`Dicetak: ${printDate}`]);
  sheet.mergeCells(dateRow.number, 1, dateRow.number, columns.length);
  dateRow.getCell(1).font = { name: "Calibri", size: 9, italic: true, color: { argb: "FF94A3B8" } };

  // Empty row
  sheet.addRow([]);

  // ── Header row ──
  const headerRow = sheet.addRow(columns.map((col) => col.label));
  const headerRowNum = headerRow.number;
  headerRow.eachCell((cell) => {
    cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E40AF" },
    };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: false };
    cell.border = {
      top: { style: "thin", color: { argb: "FF1E3A8A" } },
      bottom: { style: "thin", color: { argb: "FF1E3A8A" } },
      left: { style: "thin", color: { argb: "FF1E3A8A" } },
      right: { style: "thin", color: { argb: "FF1E3A8A" } },
    };
  });
  headerRow.height = 24;

  // ── Data rows ──
  const zebraLight = "FFF8FAFC";
  const zebraDark = "FFFFFFFF";
  const borderStyle: ExcelJS.Border = {
    style: "thin",
    color: { argb: "FFE2E8F0" },
  };

  rows.forEach((row, idx) => {
    const values = columns.map((col) => {
      const raw = row[col.key];
      return col.format ? col.format(raw, row) : (raw ?? "-");
    });

    const dataRow = sheet.addRow(values);
    const bgColor = idx % 2 === 0 ? zebraLight : zebraDark;

    dataRow.eachCell((cell, colNumber) => {
      const col = columns[colNumber - 1];
      cell.font = { name: "Calibri", size: 10, color: { argb: "FF334155" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
      cell.border = {
        top: borderStyle,
        bottom: borderStyle,
        left: borderStyle,
        right: borderStyle,
      };

      // Right-align numbers (nilai, count columns)
      const val = cell.value;
      if (typeof val === "number" || (typeof val === "string" && /^\d+(\.\d+)?$/.test(val))) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle", wrapText: true };
      }
    });

    dataRow.height = 20;
  });

  // ── Summary row ──
  sheet.addRow([]);
  const summaryRow = sheet.addRow([`Total: ${rows.length} data`]);
  sheet.mergeCells(summaryRow.number, 1, summaryRow.number, columns.length);
  const summaryCell = summaryRow.getCell(1);
  summaryCell.font = { name: "Calibri", size: 10, bold: true, italic: true, color: { argb: "FF64748B" } };
  summaryCell.alignment = { horizontal: "right" };

  // ── Auto-fit column widths ──
  columns.forEach((col, i) => {
    const excelCol = sheet.getColumn(i + 1);
    // Min width: label length, max cap
    const headerLen = col.label.length;
    const maxDataLen = rows.reduce((max, row) => {
      const val = col.format ? col.format(row[col.key], row) : String(row[col.key] ?? "-");
      return Math.max(max, Math.min(val.length, 50));
    }, 0);
    excelCol.width = col.width ?? Math.max(headerLen + 4, Math.min(maxDataLen + 4, 40));
  });

  // ── Freeze header row ──
  sheet.views = [{ state: "frozen", ySplit: headerRowNum }];

  // ── Auto-filter ──
  sheet.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: columns.length },
  };

  // ── Generate & download ──
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  triggerDownload(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

// ─── Shared download trigger ─────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
