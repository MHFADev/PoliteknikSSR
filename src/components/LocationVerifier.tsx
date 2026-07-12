"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MapPin, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import styles from "@/styles/components/shared/LocationVerifier.module.css";

type VerifierProps = {
  onVerified?: () => void;
};

export function LocationVerifier({ onVerified }: VerifierProps) {
  const [status, setStatus] = useState<'loading' | 'checking' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);

  // Fungsi haversine untuk menghitung jarak antara dua titik (dalam meter)
  const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Radius bumi dalam meter
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // Fungsi verifikasi lokasi — dibungkus useCallback agar stabil sebagai dependency useEffect
  const verifyLocation = useCallback(async () => {
    try {
      setStatus('checking');
      setMessage('Memeriksa lokasi...');

      // 0. Cek izin lokasi terlebih dahulu
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (permission.state === "denied") {
          setStatus('error');
          setMessage('Izin lokasi ditolak. Harap aktifkan izin lokasi di pengaturan browser Anda.');
          return;
        }
      } catch {
        // Permissions API tidak didukung, lanjutkan
      }

      // 1. Dapatkan izin lokasi dan koordinat siswa
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true, // Akurasi tinggi untuk presisi
            timeout: 15000, // Timeout 15 detik
            maximumAge: 0, // Selalu dapat lokasi baru
          }
        );
      });

      const { latitude, longitude } = position.coords;

      // 2. Dapatkan daftar lokasi yang diizinkan dari server
      const response = await fetch('/api/locations');
      if (!response.ok) {
        throw new Error('Gagal mendapatkan daftar lokasi');
      }
      const locations = await response.json();

      if (!locations || locations.length === 0) {
        setStatus('success');
        setMessage('Lokasi tidak perlu diverifikasi');
        onVerified?.();
        return;
      }

      // 3. Cek apakah siswa berada di dalam radius salah satu lokasi (default 50m)
      let isInside = false;
      let nearestDistance = Infinity;
      let nearestLocation = null;

      for (const loc of locations) {
        const dist = haversine(latitude, longitude, loc.latitude, loc.longitude);
        if (dist < nearestDistance) {
          nearestDistance = dist;
          nearestLocation = loc;
        }
        // Cek apakah dalam radius (default 50m jika tidak ada konfigurasi)
        if (dist <= (loc.radius_meters || 50)) {
          isInside = true;
          break;
        }
      }

      setDistance(nearestDistance);

      if (isInside) {
        setStatus('success');
        setMessage(`Anda berada di dalam area ${nearestLocation?.nama}!`);
        onVerified?.();
      } else {
        setStatus('error');
        setMessage(`Anda berada ${Math.round(nearestDistance)}m di luar area ${nearestLocation?.nama}`);
      }

    } catch (error: any) {
      console.error('Error verifying location:', error);
      setStatus('error');
      
      if (error.code === 1) {
        setMessage('Izin lokasi ditolak. Harap aktifkan GPS dan izinkan akses lokasi.');
      } else if (error.code === 2) {
        setMessage('Tidak dapat menemukan lokasi. Pastikan GPS aktif dan Anda berada di area terbuka.');
      } else if (error.code === 3) {
        setMessage('Waktu pencarian lokasi habis. Coba lagi.');
      } else {
        setMessage(`Terjadi kesalahan: ${error.message}`);
      }
    }
  }, [onVerified]);

  /*
   * Jalankan verifikasi otomatis saat komponen dimount.
   * useCallback menjaga referensi verifyLocation tetap stabil.
   */
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Browser Anda tidak mendukung geolocation');
      return;
    }
    verifyLocation();
  }, [verifyLocation]);

  return (
    <div className={styles.wrapper}>
      <div className={cn(
        styles.statusCard,
        status === 'success' && styles.statusSuccess,
        status === 'error' && styles.statusError,
        (status === 'loading' || status === 'checking') && styles.statusLoading
      )}>
        {status === 'loading' || status === 'checking' ? (
          <Loader2 className={cn(
            styles.iconLoading,
            status === 'checking' ? styles.iconLoadingChecking : styles.iconLoadingIdle
          )} />
        ) : status === 'success' ? (
          <CheckCircle2 className={styles.iconSuccess} />
        ) : (
          <AlertCircle className={styles.iconError} />
        )}

        <div className={styles.contentArea}>
          <h4 className={cn(
            styles.title,
            status === 'success' && styles.titleSuccess,
            status === 'error' && styles.titleError,
            (status === 'loading' || status === 'checking') && styles.titleLoading
          )}>
            {status === 'loading' ? 'Memulai verifikasi lokasi...' :
             status === 'checking' ? 'Memeriksa lokasi Anda...' :
             status === 'success' ? 'Lokasi Terverifikasi' :
             'Verifikasi Lokasi Gagal'}
          </h4>
          {message && (
            <p className={cn(
              styles.message,
              status === 'success' && styles.messageSuccess,
              status === 'error' && styles.messageError,
              (status === 'loading' || status === 'checking') && styles.messageLoading
            )}>
              {message}
              {distance !== null && status !== 'success' && (
                <span className={styles.distance}>(jarak: {Math.round(distance)}m)</span>
              )}
            </p>
          )}
        </div>
      </div>

      {status === 'error' && (
        <button
          onClick={verifyLocation}
          className={styles.retryButton}
        >
          <MapPin className="w-4 h-4" />
          Coba Lagi Verifikasi Lokasi
        </button>
      )}
    </div>
  );
}
