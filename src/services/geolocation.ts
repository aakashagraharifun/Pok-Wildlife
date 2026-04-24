import type { Coords } from "@/types";
import { DEFAULT_COORDS } from "@/data/seed";

export async function getCurrentCoords(): Promise<Coords> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return DEFAULT_COORDS;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(DEFAULT_COORDS),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30_000 },
    );
  });
}

export function watchCoords(onUpdate: (c: Coords) => void): () => void {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    onUpdate(DEFAULT_COORDS);
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => onUpdate(DEFAULT_COORDS),
    { enableHighAccuracy: true, maximumAge: 5000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}