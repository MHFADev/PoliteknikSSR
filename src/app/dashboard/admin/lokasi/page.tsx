"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, MapPin, Trash2, Edit } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  getLocations,
  addLocation,
  updateLocation,
  deleteLocation,
} from "@/actions/location";
import { LocationPicker } from "@/components/LocationPicker";
import styles from "@/styles/pages/dashboard/admin/Lokasi.module.css";

type Location = {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
};

export default function AdminLokasiPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempLocation, setTempLocation] = useState({
    latitude: -6.2088,
    longitude: 106.8456,
    radius_meters: 100,
  });

  async function loadLocations() {
    setLoading(true);
    const data = await getLocations();
    setLocations(data);
    setLoading(false);
  }

  useEffect(() => {
    loadLocations();
  }, []);

  function openAdd() {
    setEditing(null);
    setError(null);
    const defaultLoc = locations[0] ?? {
      latitude: -6.2088,
      longitude: 106.8456,
      radius_meters: 50,
    };
    setTempLocation({
      latitude: defaultLoc.latitude,
      longitude: defaultLoc.longitude,
      radius_meters: 50,
    });
    setModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing(loc);
    setError(null);
    setTempLocation({
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius_meters: loc.radiusMeters,
    });
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const nama = form.get("nama") as string;
    const radius_meters = parseFloat(form.get("radius_meters") as string);

    if (isNaN(radius_meters) || radius_meters < 1) {
      setError("Radius harus lebih dari 0.");
      setIsSubmitting(false);
      return;
    }

    let result;
    if (editing) {
      result = await updateLocation(
        editing.id,
        nama,
        tempLocation.latitude,
        tempLocation.longitude,
        radius_meters,
      );
    } else {
      result = await addLocation(
        nama,
        tempLocation.latitude,
        tempLocation.longitude,
        radius_meters,
      );
    }

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message ?? "Gagal menyimpan.");
      return;
    }

    setModalOpen(false);
    setEditing(null);
    loadLocations();
  }

  async function handleDelete(id: string) {
    if (!confirm("Hapus lokasi ini?")) return;
    await deleteLocation(id);
    loadLocations();
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1>Lokasi GPS</h1>
        <p>
          Atur lokasi yang diizinkan untuk verifikasi GPS saat login. Siswa
          hanya bisa login jika berada dalam radius lokasi ini
        </p>
      </div>

      <Card>
        <CardHeader
          title="Daftar Lokasi"
          subtitle="Siswa harus berada dalam radius salah satu lokasi ini untuk login"
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Tambah Lokasi
            </Button>
          }
        />

        {loading ? (
          <div className={styles.loadingSpinner}>
            <Loader2 className="h-6 w-6 animate-spin text-steel" />
          </div>
        ) : locations.length === 0 ? (
          <p className={styles.emptyState}>
            Belum ada lokasi. Tambahkan lokasi untuk mengaktifkan verifikasi
            GPS.
          </p>
        ) : (
          <div className={styles.locationList}>
            {locations.map((loc) => (
              <div key={loc.id} className={styles.locationItem}>
                <div className={styles.locationInfo}>
                  <div className={styles.locationIcon}>
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className={styles.locationName}>{loc.nama}</p>
                    <p className={styles.locationCoords}>
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}{" "}
                      &mdash; Radius {loc.radiusMeters}m
                    </p>
                  </div>
                </div>
                <div className={styles.locationActions}>
                  <Button variant="ghost" onClick={() => openEdit(loc)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDelete(loc.id)}>
                    <Trash2 className="h-4 w-4 text-danger" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
          setError(null);
        }}
        title={editing ? "Edit Lokasi" : "Tambah Lokasi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Nama Lokasi</label>
            <input
              name="nama"
              type="text"
              required
              defaultValue={editing?.nama ?? ""}
              placeholder="Gedung Utama Kampus"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Latitude</label>
            <input
              type="number"
              step="any"
              required
              value={tempLocation.latitude}
              onChange={(e) =>
                setTempLocation({
                  ...tempLocation,
                  latitude: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="-6.2088"
              className={styles.formInput}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Longitude</label>
            <input
              type="number"
              step="any"
              required
              value={tempLocation.longitude}
              onChange={(e) =>
                setTempLocation({
                  ...tempLocation,
                  longitude: parseFloat(e.target.value) || 0,
                })
              }
              placeholder="106.8456"
              className={styles.formInput}
            />
          </div>

          <LocationPicker
            value={tempLocation}
            onChange={(newLoc) => setTempLocation(newLoc)}
          />

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Radius (meter)</label>
            <input
              name="radius_meters"
              type="number"
              required
              min={1}
              value={tempLocation.radius_meters}
              onChange={(e) =>
                setTempLocation({
                  ...tempLocation,
                  radius_meters: parseFloat(e.target.value) || 100,
                })
              }
              placeholder="100"
              className={styles.formInput}
            />
          </div>

          {error && <p className={styles.formError}>{error}</p>}

          <div className={styles.formActions}>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setModalOpen(false);
                setEditing(null);
                setError(null);
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {editing ? "Simpan" : "Tambah"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
