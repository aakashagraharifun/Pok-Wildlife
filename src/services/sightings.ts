import type { Sighting, PublicUser } from "@/types";
import { getSightings, setSightings, getUsers, newId } from "./store";
import { updateCurrentUserScore } from "./auth";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function listAllSightings(): Promise<Sighting[]> {
  await delay(180);
  return getSightings().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export async function listUserSightings(userId: string): Promise<Sighting[]> {
  await delay(160);
  return getSightings()
    .filter((s) => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function addSighting(input: Omit<Sighting, "id" | "createdAt">): Promise<Sighting> {
  await delay(200);
  const sighting: Sighting = {
    ...input,
    id: newId("s"),
    createdAt: new Date().toISOString(),
  };
  const all = getSightings();
  setSightings([sighting, ...all]);
  updateCurrentUserScore(sighting.score);
  return sighting;
}

export function userHasCapturedSpecies(userId: string, speciesName: string): boolean {
  return getSightings().some(
    (s) => s.userId === userId && s.speciesName === speciesName,
  );
}

export function userCapturedSpeciesToday(userId: string, speciesName: string): boolean {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return getSightings().some(
    (s) =>
      s.userId === userId &&
      s.speciesName === speciesName &&
      new Date(s.createdAt).getTime() >= todayStart.getTime(),
  );
}

export async function getLeaderboard(): Promise<PublicUser[]> {
  await delay(180);
  return getUsers()
    .map(({ id, name, totalScore, createdAt }) => ({ id, name, totalScore, createdAt }))
    .sort((a, b) => b.totalScore - a.totalScore);
}

export function getUserById(id: string) {
  return getUsers().find((u) => u.id === id);
}

export async function getSightingById(id: string): Promise<Sighting | null> {
  return getSightings().find((s) => s.id === id) ?? null;
}