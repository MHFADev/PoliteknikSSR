/*
 * location.ts — Manajemen Lokasi Presensi (Geofence)
 * ==========================================
 * Server actions untuk mengecek lokasi pengguna saat login dan
 * CRUD lokasi yang diizinkan untuk presensi.
 *
 * Alur:
 * - checkLoginLocation: verifikasi apakah koordinat user berada dalam radius
 *   lokasi yang diizinkan (menggunakan rumus Haversine)
 * - hasLocationsConfigured: cek apakah ada lokasi yang dikonfigurasi
 * - CRUD lokasi: dikelola oleh Admin
 *
 * Keputusan teknis:
 * - Haversine formula dipilih karena cukup akurat untuk jarak pendekomputeran
 *   dan tanpa dependensi eksternal (dibandingkan PostGIS yang butuh ekstensi DB)
 * - Jika tidak ada lokasi terdaftar, semua lokasi dianggap valid (fallback aman)
 */

"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * haversine — Hitung jarak antara dua titik koordinat (dalam meter)
 * Menggunakan rumus Haversine (great-circle distance).
 *
 * @param lat1 - Latitude titik 1
 * @param lon1 - Longitude titik 1
 * @param lat2 - Latitude titik 2
 * @param lon2 - Longitude titik 2
 * @returns Jarak dalam meter
 */
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * checkLoginLocation — Verifikasi koordinat user terhadap lokasi yang diizinkan
 * @param latitude - Latitude user saat ini
 * @param longitude - Longitude user saat ini
 * @returns Object { allowed, error? }
 *
 * Alur:
 * 1. Ambil semua lokasi yang diizinkan dari database
 * 2. Jika tidak ada lokasi terdaftar → izinkan (allowed: true)
 * 3. Cek apakah user berada dalam radius salah satu lokasi
 * 4. Jika tidak → sign out + return error
 */
export async function checkLoginLocation(latitude: number, longitude: number) {
  const supabase = createClient();

  const { data: locations } = await supabase
    .from("allowed_locations")
    .select("*");

  // --- Jika tidak ada lokasi terdaftar, izinkan akses dari mana saja ---
  if (!locations || locations.length === 0) {
    return { allowed: true };
  }

  // --- Cek apakah user berada dalam radius salah satu lokasi ---
  const isInside = locations.some(
    (loc) => haversine(latitude, longitude, loc.latitude, loc.longitude) <= loc.radius_meters
  );

  if (!isInside) {
    // Logout paksa jika di luar lokasi
    await supabase.auth.signOut();
    return { allowed: false, error: "Anda tidak berada di lokasi yang diizinkan. Pastikan GPS aktif dan Anda berada di area kampus." };
  }

  return { allowed: true };
}

/**
 * hasLocationsConfigured — Cek apakah ada lokasi yang sudah dikonfigurasi
 * @returns boolean
 */
export async function hasLocationsConfigured() {
  const supabase = createClient();
  const { count } = await supabase
    .from("allowed_locations")
    .select("*", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

/**
 * getLocations — Ambil semua lokasi yang diizinkan (Admin)
 * @returns Array lokasi
 */
export async function getLocations() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("allowed_locations")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
}

/**
 * addLocation — Tambah lokasi baru (Admin)
 */
export async function addLocation(nama: string, latitude: number, longitude: number, radius_meters: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_locations")
    .insert({ nama, latitude, longitude, radius_meters });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

/**
 * updateLocation — Update lokasi yang sudah ada (Admin)
 */
export async function updateLocation(id: string, nama: string, latitude: number, longitude: number, radius_meters: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_locations")
    .update({ nama, latitude, longitude, radius_meters })
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

/**
 * deleteLocation — Hapus lokasi (Admin)
 */
export async function deleteLocation(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_locations")
    .delete()
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}