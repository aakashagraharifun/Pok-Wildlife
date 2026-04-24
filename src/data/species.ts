import type { SpeciesCacheEntry } from "@/types";

/** Seeded "species_cache" — emoji + rarity. */
export const SPECIES: SpeciesCacheEntry[] = [
  { speciesName: "House Sparrow", emoji: "🐦", rarityScore: 5 },
  { speciesName: "Mallard Duck", emoji: "🦆", rarityScore: 10 },
  { speciesName: "Eastern Gray Squirrel", emoji: "🐿️", rarityScore: 8 },
  { speciesName: "Honey Bee", emoji: "🐝", rarityScore: 12 },
  { speciesName: "Common Pigeon", emoji: "🕊️", rarityScore: 4 },
  { speciesName: "Monarch Butterfly", emoji: "🦋", rarityScore: 55 },
  { speciesName: "Red Fox", emoji: "🦊", rarityScore: 65 },
  { speciesName: "American Robin", emoji: "🐦", rarityScore: 18 },
  { speciesName: "White-tailed Deer", emoji: "🦌", rarityScore: 45 },
  { speciesName: "Blue Jay", emoji: "🪶", rarityScore: 30 },
  { speciesName: "Garter Snake", emoji: "🐍", rarityScore: 50 },
  { speciesName: "Ladybug", emoji: "🐞", rarityScore: 22 },
  { speciesName: "Snapping Turtle", emoji: "🐢", rarityScore: 60 },
  { speciesName: "Great Horned Owl", emoji: "🦉", rarityScore: 80 },
  { speciesName: "Bald Eagle", emoji: "🦅", rarityScore: 88 },
  { speciesName: "River Otter", emoji: "🦦", rarityScore: 82 },
  { speciesName: "Bobcat", emoji: "🐈", rarityScore: 92 },
  { speciesName: "Luna Moth", emoji: "🌙", rarityScore: 85 },
  { speciesName: "Hummingbird", emoji: "🐦", rarityScore: 70 },
  { speciesName: "Pacific Tree Frog", emoji: "🐸", rarityScore: 40 },
];

export function findSpecies(name: string): SpeciesCacheEntry | undefined {
  return SPECIES.find((s) => s.speciesName === name);
}

/** Weighted random pick — common species more likely. */
export function pickRandomSpecies(): SpeciesCacheEntry {
  // Weight = (101 - rarity), so common species get higher weight
  const weights = SPECIES.map((s) => 101 - s.rarityScore);
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < SPECIES.length; i++) {
    r -= weights[i];
    if (r <= 0) return SPECIES[i];
  }
  return SPECIES[0];
}