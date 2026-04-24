export interface User {
  id: string;
  name: string;
  email: string;
  /** mock only — never store real password hashes client-side */
  passwordHash: string;
  totalScore: number;
  createdAt: string;
}

export interface Sighting {
  id: string;
  userId: string;
  /** data: URL or seeded https URL */
  imageUrl: string;
  speciesName: string;
  emoji: string;
  confidence: number;
  lat: number;
  lng: number;
  score: number;
  isSuspicious: boolean;
  createdAt: string;
}

export interface SpeciesCacheEntry {
  speciesName: string;
  emoji: string;
  /** 0 (very common) — 100 (very rare) */
  rarityScore: number;
}

export interface ScoreBreakdown {
  base: number;
  duplicateMultiplier?: number;
  newSpeciesBonus?: number;
  rareBonus?: number;
  zooMultiplier?: number;
  total: number;
  isSuspicious: boolean;
}

export interface IdentificationResult {
  speciesName: string;
  emoji: string;
  confidence: number;
}

export interface Coords {
  lat: number;
  lng: number;
}

export interface PublicUser {
  id: string;
  name: string;
  totalScore: number;
  createdAt: string;
}