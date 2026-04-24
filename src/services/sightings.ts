import type { Sighting, PublicUser } from "@/types";
import { supabase } from "@/lib/supabase";

export type LeaderboardTimeframe = "all-time" | "weekly";
export type LeaderboardScope = "worldwide" | "nearby";

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

/**
 * Extended leaderboard with timeframe and scope filtering.
 * Currently falls back to basic leaderboard until complex filtering is needed.
 */
export async function getLeaderboardExtended(
  timeframe: LeaderboardTimeframe,
  scope: LeaderboardScope,
  userCoords?: { lat: number; lng: number }
): Promise<PublicUser[]> {
  // For now, reuse the basic leaderboard
  // Future: Implement timeframe and nearby filtering in Supabase
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