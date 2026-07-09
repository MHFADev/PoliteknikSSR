"use client";

// Utility export CSV generik — dipakai di halaman Admin > Export.
// Sengaja tidak pakai library eksternal karena kebutuhannya sederhana (array of object -> CSV).

export function exportToCSV<T extends Record<string, unknown>>(
  rows: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
) {
  if (rows.length === 0) return;

  const cols = columns ?? Object.keys(rows[0]).map((key) => ({ key: key as keyof T, label: key }));

  const escapeCell = (value: unknown) => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const header = cols.map((c) => escapeCell(c.label)).join(",");
  const body = rows.map((row) => cols.map((c) => escapeCell(row[c.key])).join(",")).join("\n");
  const csvContent = `${header}\n${body}`;

  // Tambahkan BOM supaya karakter non-ASCII (misal nama dengan huruf khusus) tampil benar di Excel
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
