import type { Coords } from "@/types";

/**
 * Mock zoo proximity check.
 * TODO: Replace with Overpass API:
 *   POST https://overpass-api.de/api/interpreter
 *   Body: [out:json];node["tourism"="zoo"](around:500,{lat},{lng});out;
 *   Returns true if elements.length > 0.
 */
export async function isNearZoo(_coords: Coords): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 300));
  return Math.random() < 0.15;
}