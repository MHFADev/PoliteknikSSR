/*
 * export-csv.ts — Ekspor Data ke CSV
 * ==========================================
 * Utility client-side untuk mengekspor array of objects ke file CSV.
 * Dipakai di halaman Admin > Export untuk mengunduh data presensi, logbook, dll.
 *
 * Keputusan teknis:
 * - Tidak pakai library eksternal karena kebutuhan sederhana (array → CSV)
 * - Menambahkan BOM (Byte Order Mark) \uFEFF agar Excel bisa membaca UTF-8
 *   dengan benar (termasuk karakter non-ASCII seperti nama dengan aksen)
 * - Escape cell yang mengandung koma, kutip, atau newline
 */

"use client";

/**
 * exportToCSV — Ekspor array data ke file CSV dan trigger download
 * @param rows - Array data bertipe Record<string, unknown>
 * @param filename - Nama file (tanpa atau dengan .csv)
 * @param columns - Optional: definisi kolom { key, label }. Jika tidak ada, pakai keys dari row pertama
 *
 * Alur:
 * 1. Tentukan kolom (dari parameter atau infer dari object keys)
 * 2. Escape setiap cell (koma, kutip, newline)
 * 3. Gabung header + body dengan newline
 * 4. Tambahkan BOM UTF-8
 * 5. Buat Blob → URL → trigger download via link.click()
 */
export function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (rows.length === 0) return;

  // --- Tentukan kolom: dari parameter atau infer dari keys baris pertama ---
  const cols = columns ?? Object.keys(rows[0]).map((key) => ({ key: key as keyof T, label: key }));

  // --- Escape nilai cell untuk CSV (handle koma, kutip, newline) ---
  const escapeCell = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // --- Buat header dan body CSV ---
  const header = cols.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) => cols.map((c) => escapeCell(row[c.key])).join(",")).join("\n");
  const csvContent = `${header}\n${body}`;

  // --- Trigger download (dengan BOM untuk kompatibilitas Excel) ---
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
