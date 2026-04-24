import type { IdentificationResult } from "@/types";
import { pickRandomSpecies } from "@/data/species";

const INAT_API = import.meta.env.VITE_INAT_API_URL || "https://api.inaturalist.org/v1/computervision/score_image";

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
    formData.append("image", blob, "image.jpg");

    const token = import.meta.env.VITE_INAT_JWT;
    const response = await fetch(INAT_API, {
      method: "POST",
      body: formData,
      headers: {
        "Accept": "application/json",
        "User-Agent": "PokWildlifeApp/1.0",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`iNaturalist API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      throw new Error("The AI couldn't identify any species in this image. Try getting a clearer shot!");
    }

    // Top result
    const top = results[0];
    
    // taxon.preferred_common_name is usually what we want for display
    const speciesName = top.taxon.preferred_common_name || top.taxon.name;
    
    // Normalize confidence: iNaturalist scores are sometimes 0-100, sometimes 0-1
    let confidence = top.combined_score;
    if (confidence > 1) confidence = confidence / 100;

    return {
      speciesName,
      emoji: getEmojiForTaxon(top.taxon),
      confidence,
    };
  } catch (err) {
    console.error("iNaturalist Identification failed:", err);
    if (retries > 0 && err instanceof Error && err.name !== "AbortError") {
      console.log(`Retrying identification (${retries} left)...`);
      return identifySpecies(imageUrl, retries - 1);
    }
    // If it fails after retries, we might want to return a fallback or throw
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