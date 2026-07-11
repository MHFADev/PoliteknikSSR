/*
 * utils.ts — Fungsi Utilitas Umum
 * ==========================================
 * Berisi helper yang dipakai di berbagai komponen:
 * - cn: menggabungkan class Tailwind (clsx + tailwind-merge)
 * - formatDate: format tanggal ke locale Indonesia
 * - todayISODate: helper cepat untuk mendapatkan tanggal hari ini (YYYY-MM-DD)
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Gabungkan class Tailwind dengan resolusi konflik
 * Menggabungkan clsx (conditional classes) dengan tailwind-merge
 * (resolve konflik class Tailwind yang bertentangan).
 *
 * @param inputs - Array class value (string, object, array)
 * @returns String class yang sudah di-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatDate — Format tanggal ke format Indonesia (e.g. "12 Juli 2026")
 * @param date - Date object atau string ISO
 * @param withTime - Jika true, tambahkan jam:menit
 * @returns String tanggal terformat
 */
export function formatDate(date: string | Date, withTime = false) {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
}

/**
 * todayISODate — Dapatkan tanggal hari ini dalam format YYYY-MM-DD
 * @returns String tanggal (e.g. "2026-07-11")
 */
export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}
