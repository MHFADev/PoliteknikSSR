"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";

type Location = {
  latitude: number;
  longitude: number;
  radius_meters: number;
};

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapPickerInner({
  value,
  onChange,
}: {
  value: Location;
  onChange: (loc: Location) => void;
}) {
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return (
    <div style={{ height: 320, width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid #d1d5db" }}>
      <MapContainer
        center={[value.latitude, value.longitude]}
        zoom={15}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker
          position={[value.latitude, value.longitude]}
          icon={markerIcon}
          draggable={true}
          eventHandlers={{
            dragend: (e) => {
              const m = e.target;
              const pos = m.getLatLng();
              onChange({ ...value, latitude: pos.lat, longitude: pos.lng });
            },
          }}
        />
        <Circle
          center={[value.latitude, value.longitude]}
          radius={value.radius_meters}
          pathOptions={{ color: "#2BA8A2", fillColor: "#2BA8A2", fillOpacity: 0.15 }}
        />
        <ClickHandler
          onPick={(lat, lng) => onChange({ ...value, latitude: lat, longitude: lng })}
        />
      </MapContainer>
    </div>
  );
}