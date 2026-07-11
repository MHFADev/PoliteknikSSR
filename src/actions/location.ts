"use server";

import { Repositories } from "@/lib/repositories";

export async function checkLoginLocation(latitude: number, longitude: number) {
  const result = await Repositories.location().verifyLocation(latitude, longitude);

  if (!result.allowed) {
    await Repositories.users().signOut();
    return {
      allowed: false,
      error: "Anda tidak berada di lokasi yang diizinkan. Pastikan GPS aktif dan Anda berada di area kampus.",
    };
  }

  return { allowed: true };
}

export async function hasLocationsConfigured() {
  return Repositories.location().hasLocations();
}

export async function getLocations() {
  return Repositories.location().getAll();
}

export async function addLocation(nama: string, latitude: number, longitude: number, radius_meters: number) {
  const result = await Repositories.location().create({
    nama,
    latitude,
    longitude,
    radiusMeters: radius_meters,
  });
  if (result.error) return { success: false, message: result.error };
  return { success: true };
}

export async function updateLocation(id: string, nama: string, latitude: number, longitude: number, radius_meters: number) {
  const result = await Repositories.location().update(id, {
    nama,
    latitude,
    longitude,
    radiusMeters: radius_meters,
  });
  if (result.error) return { success: false, message: result.error };
  return { success: true };
}

export async function deleteLocation(id: string) {
  const result = await Repositories.location().delete(id);
  if (result.error) return { success: false, message: result.error };
  return { success: true };
}
