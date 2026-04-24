import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Sighting } from "@/types";

// Build a divIcon per sighting using its emoji.
function emojiIcon(emoji: string, suspicious: boolean) {
  return L.divIcon({
    className: "pok-marker",
    html: `
      <div style="
        position:relative;
        display:flex;align-items:center;justify-content:center;
        width:40px;height:40px;border-radius:50%;
        background:#ffffff;
        box-shadow:0 4px 12px rgba(0,0,0,0.18);
        border:2px solid ${suspicious ? "#f59e0b" : "#1B4332"};
        font-size:22px;
      ">
        <span>${emoji}</span>
        ${
          suspicious
            ? '<span style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;border-radius:50%;background:#f59e0b;color:#1B4332;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;">!</span>'
            : ""
        }
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
}

function FitBounds({ sightings }: { sightings: Sighting[] }) {
  const map = useMap();
  useEffect(() => {
    if (!sightings.length) return;
    const bounds = L.latLngBounds(sightings.map((s) => [s.lat, s.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [sightings, map]);
  return null;
}

interface Props {
  sightings: Sighting[];
  onSelect: (s: Sighting) => void;
  center?: { lat: number; lng: number };
}

export function MapView({ sightings, onSelect, center }: Props) {
  const fallback = center ?? { lat: 40.785091, lng: -73.968285 };
  return (
    <MapContainer
      center={[fallback.lat, fallback.lng]}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%", background: "var(--muted)" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds sightings={sightings} />
      {sightings.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={emojiIcon(s.emoji, s.isSuspicious)}
          eventHandlers={{ click: () => onSelect(s) }}
        />
      ))}
    </MapContainer>
  );
}