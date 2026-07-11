// ============================================================
// ILocationRepository — Interface Repository untuk Geofence
// ============================================================
// Menangani lokasi yang diizinkan untuk verifikasi GPS saat
// presensi atau login. Menggunakan sistem geofence dengan
// radius meter dari titik koordinat.
//
// Pola:
// - Admin mendaftarkan titik lokasi kampus
// - Saat siswa login/absensi, sistem cek apakah posisi GPS
//   siswa berada dalam radius salah satu titik yang diizinkan
// ============================================================

import type { AllowedLocation, CreateLocationInput } from "../types";

export interface ILocationRepository {
  /**
   * getAll — Ambil semua lokasi yang diizinkan
   * @returns Array lokasi
   */
  getAll(): Promise<AllowedLocation[]>;

  /**
   * create — Tambah lokasi baru
   * @param input — Data lokasi (CreateLocationInput)
   * @returns ID lokasi atau error
   */
  create(input: CreateLocationInput): Promise<{ id?: string; error?: string }>;

  /**
   * update — Update data lokasi
   * @param id — UUID lokasi
   * @param input — Data partial yang akan diupdate
   */
  update(
    id: string,
    input: Partial<CreateLocationInput>
  ): Promise<{ error?: string }>;

  /**
   * delete — Hapus lokasi
   * @param id — UUID lokasi
   */
  delete(id: string): Promise<{ error?: string }>;

  /**
   * verifyLocation — Verifikasi apakah koordinat GPS berada dalam radius yang diizinkan
   * @param latitude — Latitude posisi user
   * @param longitude — Longitude posisi user
   * @returns allowed (boolean) dan nama lokasi jika dalam radius
   */
  verifyLocation(
    latitude: number,
    longitude: number
  ): Promise<{ allowed: boolean; locationName?: string }>;

  /**
   * hasLocations — Cek apakah ada lokasi yang terdaftar
   * @returns true jika ada minimal 1 lokasi
   */
  hasLocations(): Promise<boolean>;
}
