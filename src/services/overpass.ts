import type { Coords } from "@/types";

const OVERPASS_API = "https://overpass-api.de/api/interpreter";

/**
 * Checks if the coordinates are near a zoo or a park using Overpass API.
 */
export async function checkProximity(coords: Coords): Promise<{ isNearZoo: boolean; isNearPark: boolean }> {
  const { lat, lng } = coords;
  
  // Query for both zoos and parks within 500m
  const query = `
    [out:json][timeout:25];
    (
      node["tourism"="zoo"](around:500,${lat},${lng});
      way["tourism"="zoo"](around:500,${lat},${lng});
      node["leisure"="park"](around:500,${lat},${lng});
      way["leisure"="park"](around:500,${lat},${lng});
    );
    out body;
  `;

  try {
    const response = await fetch(OVERPASS_API, {
      method: "POST",
      body: query,
    });

    if (!response.ok) throw new Error("Overpass API failed");

    const data = await response.json();
    const elements = data.elements || [];

    const isNearZoo = elements.some((el: any) => el.tags?.tourism === "zoo");
    const isNearPark = elements.some((el: any) => el.tags?.leisure === "park");

    return { isNearZoo, isNearPark };
  } catch (err) {
    console.error("Proximity check failed", err);
    return { isNearZoo: false, isNearPark: false };
  }
}

/**
 * @deprecated Use checkProximity instead
 */
export async function isNearZoo(coords: Coords): Promise<boolean> {
  const res = await checkProximity(coords);
  return res.isNearZoo;
}