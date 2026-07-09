"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function checkLoginLocation(latitude: number, longitude: number) {
  const supabase = createClient();

  const { data: locations } = await supabase
    .from("allowed_locations")
    .select("*");

  if (!locations || locations.length === 0) {
    return { allowed: true };
  }

  const isInside = locations.some(
    (loc) => haversine(latitude, longitude, loc.latitude, loc.longitude) <= loc.radius_meters
  );

  if (!isInside) {
    await supabase.auth.signOut();
    return { allowed: false, error: "Anda tidak berada di lokasi yang diizinkan. Pastikan GPS aktif dan Anda berada di area kampus." };
  }

  return { allowed: true };
}

export async function hasLocationsConfigured() {
  const supabase = createClient();
  const { count } = await supabase
    .from("allowed_locations")
    .select("*", { count: "exact", head: true });
  return (count ?? 0) > 0;
}

export async function getLocations() {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("allowed_locations")
    .select("*")
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addLocation(nama: string, latitude: number, longitude: number, radius_meters: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_locations")
    .insert({ nama, latitude, longitude, radius_meters });
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function updateLocation(id: string, nama: string, latitude: number, longitude: number, radius_meters: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_locations")
    .update({ nama, latitude, longitude, radius_meters })
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function deleteLocation(id: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("allowed_locations")
    .delete()
    .eq("id", id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}