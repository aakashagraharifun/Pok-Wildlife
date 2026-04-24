import type { IdentificationResult } from "@/types";
import { pickRandomSpecies } from "@/data/species";

/**
 * Mock species identification.
 * TODO: Replace with real iNaturalist Vision API call:
 *   POST https://api.inaturalist.org/v1/computervision/score_image
 *   Body: multipart/form-data { image }
 *   Read: results[0].taxon.name, results[0].combined_score
 */
export async function identifySpecies(_imageUrl: string): Promise<IdentificationResult> {
  // simulate network latency
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  // 8% chance of a "low confidence" result so the app's <0.70 branch is exercised
  const lowConfidence = Math.random() < 0.08;
  const species = pickRandomSpecies();
  const confidence = lowConfidence
    ? 0.45 + Math.random() * 0.2
    : 0.72 + Math.random() * 0.27;

  return {
    speciesName: species.speciesName,
    emoji: species.emoji,
    confidence: Math.round(confidence * 100) / 100,
  };
}