"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, MapPin, Trash2, Edit } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { getLocations, addLocation, updateLocation, deleteLocation } from "@/actions/location";

type Location = {
  id: string;
  nama: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

export default function AdminLokasiPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    setModalOpen(true);
  }

  function openEdit(loc: Location) {
    setEditing(loc);
    setError(null);
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const nama = form.get("nama") as string;
    const latitude = parseFloat(form.get("latitude") as string);
    const longitude = parseFloat(form.get("longitude") as string);
    const radius_meters = parseFloat(form.get("radius_meters") as string);

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius_meters)) {
      setError("Isi semua field dengan benar.");
      setIsSubmitting(false);
      return;
    }

    let result;
    if (editing) {
      result = await updateLocation(editing.id, nama, latitude, longitude, radius_meters);
    } else {
      result = await addLocation(nama, latitude, longitude, radius_meters);
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
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-deep">Lokasi GPS</h1>
        <p className="text-sm text-mist-dim">
          Atur lokasi yang diizinkan untuk verifikasi GPS saat login. Siswa hanya bisa login jika berada dalam radius lokasi ini.
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
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-steel" />
          </div>
        ) : locations.length === 0 ? (
          <p className="py-8 text-center text-sm text-mist-dim">
            Belum ada lokasi. Tambahkan lokasi untuk mengaktifkan verifikasi GPS.
          </p>
        ) : (
          <div className="divide-y divide-deep/6">
            {locations.map((loc) => (
              <div key={loc.id} className="flex items-start justify-between px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ocean/10 text-ocean">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-deep">{loc.nama}</p>
                    <p className="text-xs text-steel mt-0.5">
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)} &mdash; Radius {loc.radius_meters}m
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
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
        onClose={() => { setModalOpen(false); setEditing(null); setError(null); }}
        title={editing ? "Edit Lokasi" : "Tambah Lokasi"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-deep">Nama Lokasi</label>
            <input
              name="nama"
              type="text"
              required
              defaultValue={editing?.nama ?? ""}
              placeholder="Gedung Utama Kampus"
              className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-deep">Latitude</label>
              <input
                name="latitude"
                type="number"
                step="any"
                required
                defaultValue={editing?.latitude ?? ""}
                placeholder="-6.123456"
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-deep">Longitude</label>
              <input
                name="longitude"
                type="number"
                step="any"
                required
                defaultValue={editing?.longitude ?? ""}
                placeholder="106.123456"
                className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-deep">Radius (meter)</label>
            <input
              name="radius_meters"
              type="number"
              required
              min={1}
              defaultValue={editing?.radius_meters ?? 100}
              placeholder="100"
              className="mt-1.5 w-full rounded-xl border border-deep/10 bg-white/80 px-3 py-2.5 text-sm outline-none focus:border-ocean"
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => { setModalOpen(false); setEditing(null); setError(null); }}>
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