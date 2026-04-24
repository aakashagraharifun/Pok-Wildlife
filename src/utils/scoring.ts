import type { ScoreBreakdown } from "@/types";

export interface ScoreInput {
  /** 0.0 — 1.0 */
  confidence: number;
  isNewSpecies: boolean;
  /** 0 (common) — 100 (rare) */
  rarityScore: number;
  isDuplicate: boolean;
  isNearZoo: boolean;
  isNearPark: boolean;
}

/**
 * Pure scoring function. No side effects.
 */
export function calculateScore(input: ScoreInput): ScoreBreakdown {
  const { confidence, isNewSpecies, rarityScore, isDuplicate, isNearZoo, isNearPark } = input;

  let base = Math.round(Math.max(0, Math.min(1, confidence)) * 100);
  const breakdown: ScoreBreakdown = {
    base,
    total: 0,
    isSuspicious: isNearZoo,
  };

  if (isDuplicate) {
    base = Math.round(base * 0.3);
    breakdown.duplicateMultiplier = 0.3;
    breakdown.base = base;
  }

  let total = base;

  if (isNewSpecies) {
    breakdown.newSpeciesBonus = 50;
    total += 50;
  }

  if (rarityScore >= 80) {
    breakdown.rareBonus = 100;
    total += 100;
  }

  if (isNearPark) {
    breakdown.parkBonus = 25;
    total += 25;
  }

  if (isNearZoo) {
    breakdown.zooMultiplier = 0.2;
    total = Math.round(total * 0.2);
  }

  breakdown.total = Math.max(1, total);
  return breakdown;
}