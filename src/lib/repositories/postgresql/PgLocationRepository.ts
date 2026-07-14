// ============================================================
// PgLocationRepository — Implementasi ILocationRepository
// ============================================================
// Menangani lokasi yang diizinkan untuk verifikasi GPS
// dengan raw PostgreSQL queries dan Haversine formula.
// ============================================================

import { query } from "@/lib/postgres";
import type { AllowedLocation, CreateLocationInput } from "../types";
import type { ILocationRepository } from "../interfaces/ILocationRepository";

/**
 * haversineDistance — Hitung jarak antara dua titik koordinat (meter)
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/** Mapping snake_case → camelCase */
function mapLocation(row: any): AllowedLocation {
  return {
    id: row.id,
    nama: row.nama,
    latitude: row.latitude,
    longitude: row.longitude,
    radiusMeters: row.radius_meters,
  };
}

export class PgLocationRepository implements ILocationRepository {
  /**
   * getAll — Ambil semua lokasi yang diizinkan
   */
  async getAll(): Promise<AllowedLocation[]> {
    try {
      const result = await query(
        `SELECT id, nama, latitude, longitude, radius_meters
         FROM allowed_locations
         ORDER BY created_at ASC`
      );

      return result.rows.map(mapLocation);
    } catch {
      return [];
    }
  }

  /**
   * create — Tambah lokasi baru
   */
  async create(
    input: CreateLocationInput
  ): Promise<{ id?: string; error?: string }> {
    try {
      const result = await query(
        `INSERT INTO allowed_locations (id, nama, latitude, longitude, radius_meters)
         VALUES (gen_random_uuid(), $1, $2, $3, $4)
         RETURNING id`,
        [input.nama, input.latitude, input.longitude, input.radiusMeters]
      );

      return { id: result.rows[0].id };
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * update — Update data lokasi
   */
  async update(
    id: string,
    input: Partial<CreateLocationInput>
  ): Promise<{ error?: string }> {
    try {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      if (input.nama !== undefined) {
        fields.push(`nama = $${idx++}`);
        values.push(input.nama);
      }
      if (input.latitude !== undefined) {
        fields.push(`latitude = $${idx++}`);
        values.push(input.latitude);
      }
      if (input.longitude !== undefined) {
        fields.push(`longitude = $${idx++}`);
        values.push(input.longitude);
      }
      if (input.radiusMeters !== undefined) {
        fields.push(`radius_meters = $${idx++}`);
        values.push(input.radiusMeters);
      }

      if (fields.length === 0) return {};

      values.push(id);
      await query(
        `UPDATE allowed_locations SET ${fields.join(", ")} WHERE id = $${idx}`,
        values
      );

      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * delete — Hapus lokasi
   */
  async delete(id: string): Promise<{ error?: string }> {
    try {
      await query(`DELETE FROM allowed_locations WHERE id = $1`, [id]);
      return {};
    } catch (err: any) {
      return { error: err.message };
    }
  }

  /**
   * verifyLocation — Verifikasi GPS dengan Haversine
   */
  async verifyLocation(
    latitude: number,
    longitude: number
  ): Promise<{ allowed: boolean; locationName?: string }> {
    try {
      const result = await query(
        `SELECT id, nama, latitude, longitude, radius_meters
         FROM allowed_locations`
      );

      if (result.rows.length === 0) {
        return { allowed: true };
      }

      for (const loc of result.rows) {
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
    } catch {
      return { allowed: true };
    }
  }

  /**
   * hasLocations — Cek apakah ada lokasi yang terdaftar
   */
  async hasLocations(): Promise<boolean> {
    try {
      const result = await query(
        `SELECT COUNT(*)::int AS count FROM allowed_locations`
      );
      return (result.rows[0]?.count ?? 0) > 0;
    } catch {
      return false;
    }
  }
}
