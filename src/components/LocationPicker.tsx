"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Search, MapPin, LocateFixed } from "lucide-react";
import { useMap, useMapEvents } from "react-leaflet";
import styles from "@/styles/components/shared/LocationPicker.module.css";

// Import komponen Leaflet secara dinamis dengan loading component
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false, loading: () => <div className={styles.mapLoading}><p className="text-ink-muted text-sm">Memuat peta...</p></div> }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Circle = dynamic(
  () => import("react-leaflet").then((mod) => mod.Circle),
  { ssr: false }
);

// Komponen MapController dengan useMap
const MapController = ({ center, zoom }: { center: [number, number]; zoom?: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || 16);
  }, [map, center, zoom]);
  return null;
};

// Komponen MapClickHandler dengan useMapEvents
const MapClickHandler = ({ onPick }: { onPick: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

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

export function LocationPicker({ value, onChange, height = "400px" }: LocationPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([value.latitude, value.longitude]);

  // Inisialisasi Leaflet hanya di client
  useEffect(() => {
    setIsClient(true);
    
    // Fix icon marker Leaflet di Next.js
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
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
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5&countrycodes=id`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const firstResult = data[0];
        const newLocation = {
          ...value,
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon)
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
          longitude
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
        maximumAge: 0
      }
    );
  };

  const position: [number, number] = [value.latitude, value.longitude];

  return (
    <div className={styles.wrapper}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari lokasi (misal: Kampus Politeknik Negeri Jakarta)"
            className={styles.searchInput}
          />
        </div>
        <button
          type="submit"
          disabled={isSearching}
          className={styles.searchButton}
        >
          {isSearching ? (
            <div className={styles.spinner} />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Cari
        </button>
        <button
          type="button"
          onClick={autoLocateUser}
          className={styles.locateButton}
          title="Dapatkan Lokasi Saat Ini"
        >
          <LocateFixed className="w-4 h-4" />
        </button>
      </form>

      {/* Map */}
      {isClient && (
        <div className={styles.mapWrapper}>
          <MapContainer
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
                dragend(e) {
                  const latLng = e.target.getLatLng();
                  onChange({ ...value, latitude: latLng.lat, longitude: latLng.lng });
                  setMapCenter([latLng.lat, latLng.lng]);
                },
              }}
            />
            <Circle
              center={position}
              radius={value.radius_meters}
              pathOptions={{ color: "#2BA8A2", fillColor: "#2BA8A2", fillOpacity: 0.15, weight: 2 }}
            />
            <MapClickHandler
              onPick={(lat, lng) => {
                onChange({ ...value, latitude: lat, longitude: lng });
                setMapCenter([lat, lng]);
              }}
            />
          </MapContainer>
        </div>
      )}

      {/* Info Koordinat */}
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
    </div>
  );
}
