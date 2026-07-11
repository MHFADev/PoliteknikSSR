// ============================================================
// SupabaseLocationRepository — Implementasi ILocationRepository
// ============================================================
// Menangani lokasi yang diizinkan untuk verifikasi GPS saat
// presensi atau login. Menggunakan sistem geofence dengan
// radius meter dari titik koordinat.
//
// Pola:
// - Admin mendaftarkan titik lokasi kampus
// - Saat siswa login/absensi, sistem cek apakah posisi GPS
//   siswa berada dalam radius salah satu titik yang diizinkan
//
// Mapping Supabase (snake_case) → Domain (camelCase):
// - radius_meters → radiusMeters
// ============================================================

import { createClient, createAdminClient } from "@/lib/supabase/server";
import type { AllowedLocation, CreateLocationInput } from "../types";
import type { ILocationRepository } from "../interfaces/ILocationRepository";

/**
 * haversineDistance — Hitung jarak antara dua titik koordinat (dalam meter)
 * Menggunakan rumus Haversine (great-circle distance).
 *
 * @param lat1 - Latitude titik 1
 * @param lon1 - Longitude titik 1
 * @param lat2 - Latitude titik 2
 * @param lon2 - Longitude titik 2
 * @returns Jarak dalam meter
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Mapping baris Supabase ke tipe domain AllowedLocation */
function mapLocation(row: any): AllowedLocation {
  return {
    id: row.id,
    nama: row.nama,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMeters: row.radius_meters,
  };
}

export class SupabaseLocationRepository implements ILocationRepository {
  /**
   * getAll — Ambil semua lokasi yang diizinkan
   * @returns Array lokasi
   */
  async getAll(): Promise<AllowedLocation[]> {
    const supabase = createClient();

    const { data } = await supabase
      .from("allowed_locations")
      .select("*")
      .order("created_at", { ascending: true });

    if (!data) return [];
    return data.map(mapLocation);
  }

  /**
   * create — Tambah lokasi baru
   * @param input — Data lokasi (CreateLocationInput)
   * @returns ID lokasi atau error
   */
  async create(input: CreateLocationInput): Promise<{ id?: string; error?: string }> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from("allowed_locations")
      .insert({
        nama: input.nama,
        latitude: input.latitude,
        longitude: input.longitude,
        radius_meters: input.radiusMeters,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    return { id: data.id };
  }

  /**
   * update — Update data lokasi
   * @param id — UUID lokasi
   * @param input — Data partial yang akan diupdate
   */
  async update(
    id: string,
    input: Partial<CreateLocationInput>
  ): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    // Mapping partial input → snake_case untuk update
    const updateData: Record<string, any> = {};
    if (input.nama !== undefined) updateData.nama = input.nama;
    if (input.latitude !== undefined) updateData.latitude = input.latitude;
    if (input.longitude !== undefined) updateData.longitude = input.longitude;
    if (input.radiusMeters !== undefined) updateData.radius_meters = input.radiusMeters;

    const { error } = await supabase
      .from("allowed_locations")
      .update(updateData as any)
      .eq("id", id);

    if (error) return { error: error.message };
    return {};
  }

  /**
   * delete — Hapus lokasi
   * @param id — UUID lokasi
   */
  async delete(id: string): Promise<{ error?: string }> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from("allowed_locations")
      .delete()
      .eq("id", id);

    if (error) return { error: error.message };
    return {};
  }

  /**
   * verifyLocation — Verifikasi apakah koordinat GPS berada dalam radius yang diizinkan
   *
   * Alur:
   * 1. Ambil semua lokasi yang diizinkan dari database
   * 2. Jika tidak ada lokasi terdaftar → izinkan (allowed: true)
   * 3. Cek apakah user berada dalam radius salah satu lokasi
   *
   * @param latitude — Latitude posisi user
   * @param longitude — Longitude posisi user
   * @returns allowed (boolean) dan nama lokasi jika dalam radius
   */
  async verifyLocation(
    latitude: number,
    longitude: number
  ): Promise<{ allowed: boolean; locationName?: string }> {
    const supabase = createClient();

    const { data: locations } = await supabase
      .from("allowed_locations")
      .select("*");

    // --- Jika tidak ada lokasi terdaftar, izinkan akses dari mana saja ---
    if (!locations || locations.length === 0) {
      return { allowed: true };
    }

    // --- Cek apakah user berada dalam radius salah satu lokasi ---
    for (const loc of locations) {
      const distance = haversineDistance(
        latitude,
        longitude,
        loc.latitude,
        loc.longitude
      );
      if (distance <= loc.radius_meters) {
        return { allowed: true, locationName: loc.nama };
      }
    }

    return { allowed: false };
  }

  /**
   * hasLocations — Cek apakah ada lokasi yang terdaftar
   * @returns true jika ada minimal 1 lokasi
   */
  async hasLocations(): Promise<boolean> {
    const supabase = createClient();

    const { count } = await supabase
      .from("allowed_locations")
      .select("*", { count: "exact", head: true });

    return (count ?? 0) > 0;
  }
}
