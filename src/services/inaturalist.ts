import type { IdentificationResult } from "@/types";
import { pickRandomSpecies } from "@/data/species";

const INAT_API = "https://api.inaturalist.org/v1/computervision/score_image";

/**
 * Identifies species using iNaturalist Vision API.
 * Includes timeout and simple retry logic.
 */
export async function identifySpecies(
  imageUrl: string,
  retries = 2
): Promise<IdentificationResult> {
  if (!imageUrl || imageUrl.startsWith("data:image/svg+xml")) {
    // Fallback for simulation or missing image
    return mockIdentify();
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000); // 12s timeout

    // Convert data URL to blob
    const res = await fetch(imageUrl);
    const blob = await res.blob();

    const formData = new FormData();
    formData.append("image", blob, "capture.jpg");

    const response = await fetch(INAT_API, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`iNaturalist API error: ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      throw new Error("No species identified in the image.");
    }

    const top = results[0];
    return {
      speciesName: top.taxon.name,
      emoji: getEmojiForTaxon(top.taxon),
      confidence: top.combined_score,
    };
  } catch (err) {
    if (retries > 0) {
      console.warn("Identification failed, retrying...", err);
      return identifySpecies(imageUrl, retries - 1);
    }
    throw err;
  }
}

function getEmojiForTaxon(taxon: any): string {
  const iconic = taxon.iconic_taxon_name?.toLowerCase() || "";
  if (iconic === "aves") return "🐦";
  if (iconic === "mammalia") return "🐾";
  if (iconic === "reptilia") return "🦎";
  if (iconic === "amphibia") return "🐸";
  if (iconic === "insecta") return "🦋";
  if (iconic === "arachnida") return "🕷️";
  if (iconic === "actinopterygii") return "🐟";
  if (iconic === "mollusca") return "🐚";
  if (iconic === "plantae") return "🌿";
  if (iconic === "fungi") return "🍄";
  return "🔍";
}

async function mockIdentify(): Promise<IdentificationResult> {
  await new Promise((r) => setTimeout(r, 1000));
  const species = pickRandomSpecies();
  return {
    speciesName: species.speciesName,
    emoji: species.emoji,
    confidence: 0.85,
  };
}