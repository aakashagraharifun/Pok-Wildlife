import type { Sighting, PublicUser } from "@/types";
import { supabase } from "@/lib/supabase";
import { getUploadUrl } from "./storage.server";

export async function listAllSightings(): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("sightings")
    .select("*, profiles(name)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map((s: any) => ({
    ...mapSighting(s),
    userName: s.profiles?.name,
  }));
}

export async function listUserSightings(userId: string): Promise<Sighting[]> {
  const { data, error } = await supabase
    .from("sightings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapSighting);
}

export async function addSighting(input: Omit<Sighting, "id" | "createdAt">): Promise<Sighting> {
  let finalImageUrl = input.imageUrl;

  // If image is a data URL (base64), upload to R2
  if (input.imageUrl.startsWith("data:")) {
    try {
      const { uploadUrl, publicUrl } = await getUploadUrl({
        fileName: `${input.speciesName.replace(/\s+/g, "_")}.jpg`,
        contentType: "image/jpeg",
      });

      const blob = await (await fetch(input.imageUrl)).blob();
      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        body: blob,
        headers: { "Content-Type": "image/jpeg" },
      });

      if (!uploadRes.ok) throw new Error("R2 upload failed");
      finalImageUrl = publicUrl;
    } catch (err) {
      console.error("Storage upload failed, falling back to data URL", err);
    }
  }

  const { data, error } = await supabase
    .from("sightings")
    .insert({
      user_id: input.userId,
      image_url: finalImageUrl,
      species_name: input.speciesName,
      emoji: input.emoji,
      confidence: input.confidence,
      lat: input.lat,
      lng: input.lng,
      score: input.score,
      is_suspicious: input.isSuspicious,
    })
    .select()
    .single();

  if (error) throw error;

  // Also update user's total score
  const { error: uError } = await supabase.rpc("increment_user_score", {
    user_id: input.userId,
    score_delta: input.score,
  });
  
  if (uError) console.error("Failed to update user score", uError);

  return mapSighting(data);
}

export async function checkAlreadyCaptured(userId: string, speciesName: string): Promise<{ hasCapturedBefore: boolean; hasCapturedToday: boolean }> {
  const { data, error } = await supabase
    .from("sightings")
    .select("created_at")
    .eq("user_id", userId)
    .eq("species_name", speciesName);

  if (error || !data) return { hasCapturedBefore: false, hasCapturedToday: false };

  const hasCapturedBefore = data.length > 0;
  const today = new Date().toISOString().split("T")[0];
  const hasCapturedToday = data.some((s: any) => s.created_at.startsWith(today));

  return { hasCapturedBefore, hasCapturedToday };
}

export async function userHasCapturedSpecies(userId: string, speciesName: string): Promise<boolean> {
  const { hasCapturedBefore } = await checkAlreadyCaptured(userId, speciesName);
  return hasCapturedBefore;
}

export async function userCapturedSpeciesToday(userId: string, speciesName: string): Promise<boolean> {
  const { hasCapturedToday } = await checkAlreadyCaptured(userId, speciesName);
  return hasCapturedToday;
}

export async function getLeaderboard(): Promise<PublicUser[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, total_score, created_at")
    .order("total_score", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data.map((u: any) => ({
    id: u.id,
    name: u.name,
    totalScore: u.total_score,
    createdAt: u.created_at,
  }));
}

export type LeaderboardTimeframe = "all-time" | "weekly";
export type LeaderboardScope = "worldwide" | "nearby";

export async function getLeaderboardExtended(
  timeframe: LeaderboardTimeframe,
  scope: LeaderboardScope,
  userCoords?: { lat: number; lng: number }
): Promise<PublicUser[]> {
  // Complex filtering can be done via Supabase queries or Postgres functions
  // For now, let's keep it simple and reuse the basic leaderboard
  return getLeaderboard();
}

export async function getUserById(id: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", id).single();
  return data;
}

export async function getSightingById(id: string): Promise<Sighting | null> {
  const { data, error } = await supabase.from("sightings").select("*").eq("id", id).single();
  if (error || !data) return null;
  return mapSighting(data);
}

function mapSighting(s: any): Sighting {
  return {
    id: s.id,
    userId: s.user_id,
    imageUrl: s.image_url,
    speciesName: s.species_name,
    emoji: s.emoji,
    confidence: s.confidence,
    lat: s.lat,
    lng: s.lng,
    score: s.score,
    isSuspicious: s.is_suspicious,
    createdAt: s.created_at,
  };
}