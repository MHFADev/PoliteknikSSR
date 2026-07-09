"use client";

import { useEffect, useState } from "react";
import { MapPin, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

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

  // Fungsi verifikasi lokasi
  const verifyLocation = async () => {
    try {
      setStatus('checking');
      setMessage('Memeriksa lokasi...');

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
  };

  // Jalankan verifikasi otomatis saat komponen dimount
  useEffect(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setMessage('Browser Anda tidak mendukung geolocation');
      return;
    }
    verifyLocation();
  }, []);

  return (
    <div className="space-y-4">
      <div className={`p-4 rounded-xl border flex items-center gap-3 ${
        status === 'success' ? 'bg-green-50 border-green-200' :
        status === 'error' ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-200'
      }`}>
        {status === 'loading' || status === 'checking' ? (
          <Loader2 className={`w-6 h-6 animate-spin ${status === 'checking' ? 'text-blue-600' : 'text-gray-500'}`} />
        ) : status === 'success' ? (
          <CheckCircle2 className="w-6 h-6 text-green-600" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-600" />
        )}

        <div className="flex-1">
          <h4 className={`text-sm font-medium ${
            status === 'success' ? 'text-green-800' :
            status === 'error' ? 'text-red-800' :
            'text-gray-800'
          }`}>
            {status === 'loading' ? 'Memulai verifikasi lokasi...' :
             status === 'checking' ? 'Memeriksa lokasi Anda...' :
             status === 'success' ? 'Lokasi Terverifikasi' :
             'Verifikasi Lokasi Gagal'}
          </h4>
          {message && (
            <p className={`text-xs mt-1 ${
              status === 'success' ? 'text-green-600' :
              status === 'error' ? 'text-red-600' :
              'text-gray-500'
            }`}>
              {message}
              {distance !== null && status !== 'success' && (
                <span className="ml-1">(jarak: {Math.round(distance)}m)</span>
              )}
            </p>
          )}
        </div>
      </div>

      {status === 'error' && (
        <button
          onClick={verifyLocation}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <MapPin className="w-4 h-4" />
          Coba Lagi Verifikasi Lokasi
        </button>
      )}
    </div>
  );
}
