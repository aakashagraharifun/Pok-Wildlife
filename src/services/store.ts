import type { User, Sighting } from "@/types";
import { SEED_USERS, SEED_SIGHTINGS } from "@/data/seed";

const USERS_KEY = "pok.users.v1";
const SIGHTINGS_KEY = "pok.sightings.v1";
const SESSION_KEY = "pok.session.v1";
const SEEDED_KEY = "pok.seeded.v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function read<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function ensureSeeded() {
  if (!isBrowser()) return;
  if (localStorage.getItem(SEEDED_KEY)) return;
  write(USERS_KEY, SEED_USERS);
  write(SIGHTINGS_KEY, SEED_SIGHTINGS);
  localStorage.setItem(SEEDED_KEY, "1");
}

export function getUsers(): User[] {
  ensureSeeded();
  return read<User[]>(USERS_KEY, []);
}

export function setUsers(users: User[]) {
  write(USERS_KEY, users);
}

export function getSightings(): Sighting[] {
  ensureSeeded();
  return read<Sighting[]>(SIGHTINGS_KEY, []);
}

export function setSightings(s: Sighting[]) {
  write(SIGHTINGS_KEY, s);
}

export function getSessionUserId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionUserId(id: string | null) {
  if (!isBrowser()) return;
  if (id) localStorage.setItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
}

/** Tiny non-secure "hash" — mock only. */
export function hashPassword(pw: string): string {
  let h = 0;
  for (let i = 0; i < pw.length; i++) h = (h * 31 + pw.charCodeAt(i)) | 0;
  return `mock_${h}`;
}

export function newId(prefix = "id"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}