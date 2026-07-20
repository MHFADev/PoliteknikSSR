"use client";

import { useState } from "react";
import { MapPin, LocateFixed } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import styles from "@/styles/components/shared/LocationPicker.module.css";

type Location = {
  latitude: number;
  longitude: number;
  radius_meters: number;
};

type LocationPickerProps = {
  value: Location;
  onChange: (location: Location) => void;
};

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [geoError, setGeoError] = useState<string | null>(null);

  const autoLocateUser = async () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation tidak didukung browser ini.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onChange({ ...value, latitude, longitude });
      },
      (error) => {
        const msg =
          error.code === 1
            ? "Izin lokasi ditolak. Harap izinkan akses lokasi."
            : error.code === 2
              ? "Tidak dapat menemukan lokasi. Pastikan GPS aktif."
              : "Gagal mendapatkan lokasi. Coba lagi.";
        setGeoError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.coordInputs}>
        <div className={styles.coordField}>
          <label className={styles.coordLabel}>Latitude</label>
          <input
            type="number"
            step="any"
            value={value.latitude}
            onChange={(e) =>
              onChange({ ...value, latitude: parseFloat(e.target.value) || 0 })
            }
            className={styles.coordInput}
            placeholder="-6.2088"
          />
        </div>
        <div className={styles.coordField}>
          <label className={styles.coordLabel}>Longitude</label>
          <input
            type="number"
            step="any"
            value={value.longitude}
            onChange={(e) =>
              onChange({ ...value, longitude: parseFloat(e.target.value) || 0 })
            }
            className={styles.coordInput}
            placeholder="106.8456"
          />
        </div>
        <button
          type="button"
          onClick={autoLocateUser}
          className={styles.locateButton}
          title="Dapatkan Lokasi Saat Ini"
        >
          <LocateFixed className="w-4 h-4" />
          GPS Saya
        </button>
      </div>

      <div className={styles.coordInfo}>
        <div className={styles.coordText}>
          <MapPin className="w-3 h-3" />
          <span>
            Lat: {value.latitude.toFixed(6)}, Lng: {value.longitude.toFixed(6)}
          </span>
        </div>
        <span className={styles.coordRadius}>
          Radius: {value.radius_meters}m
        </span>
      </div>

      <ConfirmDialog
        open={!!geoError}
        onClose={() => setGeoError(null)}
        onConfirm={() => setGeoError(null)}
        title="Error Lokasi"
        message={geoError || ""}
        confirmLabel="OK"
        variant="warning"
      />
    </div>
  );
}
