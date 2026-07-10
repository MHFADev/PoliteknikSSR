"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import { Search, MapPin, LocateFixed } from "lucide-react";

// Import komponen Leaflet secara dinamis untuk menghindari SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false },
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false },
);
const useMap = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMap),
  { ssr: false },
);
const useMapEvents = dynamic(
  () => import("react-leaflet").then((mod) => mod.useMapEvents),
  { ssr: false },
);

type Location = {
  latitude: number;
  longitude: number;
  radius_meters: number;
};

type LocationPickerProps = {
  value: Location;
  onChange: (location: Location) => void;
  height?: string;
};

// Komponen untuk mengupdate center peta
function MapController({
  center,
  zoom,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || 16);
  }, [map, center, zoom]);
  return null;
}

// Komponen untuk handle map click
function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  const map = useMapEvents({
    click(e: any) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  height = "400px",
}: LocationPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    value.latitude,
    value.longitude,
  ]);
  const mapRef = useRef<any>(null);

  // Inisialisasi Leaflet hanya di client
  useEffect(() => {
    setIsClient(true);

    // Fix icon marker Leaflet di Next.js
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
    });
  }, []);

  // Fungsi untuk mencari lokasi via Nominatim OpenStreetMap
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=id`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const firstResult = data[0];
        const newLocation = {
          ...value,
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon),
        };
        onChange(newLocation);
        setMapCenter([newLocation.latitude, newLocation.longitude]);
      }
    } catch (error) {
      console.error("Error searching location:", error);
      alert("Gagal mencari lokasi. Silakan coba lagi.");
    } finally {
      setIsSearching(false);
    }
  };

  // Fungsi untuk mendapatkan lokasi saat ini (auto-track)
  const autoLocateUser = () => {
    if (!navigator.geolocation) {
      console.log("Geolocation tidak didukung browser ini");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newLocation = {
          ...value,
          latitude,
          longitude,
        };
        onChange(newLocation);
        setMapCenter([latitude, longitude]);
      },
      (error) => {
        console.log("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  if (!isClient) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center bg-gray-100 rounded-xl border border-gray-200"
      >
        <p className="text-gray-500 text-sm">Memuat peta...</p>
      </div>
    );
  }

  const position: [number, number] = [value.latitude, value.longitude];

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lokasi (misal: Kampus Politeknik Negeri Jakarta)"
            className="w-full rounded-xl border border-gray-300 bg-white px-10 py-2.5 text-sm outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSearching ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Cari
        </button>
        <button
          type="button"
          onClick={autoLocateUser}
          className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          title="Dapatkan Lokasi Saat Ini"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </form>

      {/* Map */}
      <div className="rounded-xl border border-deep/10 overflow-hidden relative">
        <MapContainer
          ref={mapRef}
          center={mapCenter}
          zoom={16}
          style={{ height, width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapController center={mapCenter} zoom={16} />
          <Marker
            position={position}
            draggable={true}
            eventHandlers={{
              dragend(e: any) {
                const latLng = e.target.getLatLng();
                onChange({
                  ...value,
                  latitude: latLng.lat,
                  longitude: latLng.lng,
                });
                setMapCenter([latLng.lat, latLng.lng]);
              },
            }}
          />
          <Circle
            center={position}
            radius={value.radius_meters}
            pathOptions={{
              color: "#3A5BF0",
              fillColor: "#3A5BF0",
              fillOpacity: 0.15,
              weight: 2,
            }}
          />
          <MapClickHandler
            onPick={(lat, lng) => {
              onChange({ ...value, latitude: lat, longitude: lng });
              setMapCenter([lat, lng]);
            }}
          />
        </MapContainer>
      </div>

      {/* Info Koordinat */}
      <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3" />
          <span>
            Lat: {value.latitude.toFixed(6)}, Lng: {value.longitude.toFixed(6)}
          </span>
        </div>
        <span>Radius: {value.radius_meters}m</span>
      </div>
    </div>
  );
}
