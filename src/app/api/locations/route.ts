/*
 * route.ts — API Route: Ambil Daftar Lokasi
 * ==========================================
 * API endpoint GET /api/locations untuk mengambil daftar lokasi
 * yang diizinkan untuk presensi (geofence).
 *
 * Alur:
 * - Query tabel allowed_locations
 * - Return JSON array lokasi
 * - Error handling dengan response 500
 *
 * Keputusan teknis:
 * - Hanya mengembalikan field yang diperlukan (id, nama, lat, lon, radius)
 * - Dipakai oleh komponen peta (Leaflet) di halaman admin
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: locations } = await supabase
      .from("allowed_locations")
      .select("id, nama, latitude, longitude, radius_meters")
      .order("created_at", { ascending: true });

    return NextResponse.json(locations || []);
  } catch (error) {
    console.error("Error fetching locations:", error);
    return NextResponse.json(
      { error: "Gagal mengambil lokasi" },
      { status: 500 }
    );
  }
}
