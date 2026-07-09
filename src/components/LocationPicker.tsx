"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

// Import komponen Leaflet secara dinamis untuk menghindari SSR
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
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
    const defaultCenter: [number, number] = [-6.2088, 106.8456]; // Default Jakarta

    const position: [number, number] = [value.latitude, value.longitude];

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

    // Komponen untuk handle map click
    function MapClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
        const useMapEvents = dynamic(
            () => import("react-leaflet").then((mod) => mod.useMapEvents),
            { ssr: false }
        ) as any;
        
        const MapEvents = () => {
            const map = useMapEvents({
                click(e: any) {
                    onPick(e.latlng.lat, e.latlng.lng);
                },
            });
            return null;
        };
        
        return <MapEvents />;
    }

    return (
        <div className="rounded-xl border border-deep/10 overflow-hidden">
            <MapContainer
                center={position}
                zoom={16}
                style={{ height, width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker
                    position={position}
                    draggable={true}
                    eventHandlers={{
                        dragend(e: any) {
                            const latLng = e.target.getLatLng();
                            onChange({ ...value, latitude: latLng.lat, longitude: latLng.lng });
                        },
                    }}
                />
                <Circle
                    center={position}
                    radius={value.radius_meters}
                    pathOptions={{ color: "#3A5BF0", fillColor: "#3A5BF0", fillOpacity: 0.15, weight: 2 }}
                />
                <MapClickHandler
                    onPick={(lat, lng) => onChange({ ...value, latitude: lat, longitude: lng })}
                />
            </MapContainer>
        </div>
    );
}
