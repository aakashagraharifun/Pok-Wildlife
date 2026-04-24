import type { User, Sighting } from "@/types";
import { SPECIES } from "./species";

/** Default GPS used when geolocation is denied. (Central Park, NYC) */
export const DEFAULT_COORDS = { lat: 40.785091, lng: -73.968285 };

const DAYS = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000).toISOString();
const HOURS = (n: number) => new Date(Date.now() - n * 3600 * 1000).toISOString();

export const SEED_USERS: User[] = [
  { id: "u-ava", name: "Ava Lin", email: "ava@example.com", passwordHash: "demo", totalScore: 1240, createdAt: DAYS(120) },
  { id: "u-marco", name: "Marco Diaz", email: "marco@example.com", passwordHash: "demo", totalScore: 980, createdAt: DAYS(90) },
  { id: "u-sara", name: "Sara Okafor", email: "sara@example.com", passwordHash: "demo", totalScore: 2160, createdAt: DAYS(200) },
  { id: "u-jin", name: "Jin Park", email: "jin@example.com", passwordHash: "demo", totalScore: 540, createdAt: DAYS(40) },
  { id: "u-leo", name: "Leo Brandt", email: "leo@example.com", passwordHash: "demo", totalScore: 1820, createdAt: DAYS(150) },
  { id: "u-mia", name: "Mia Rossi", email: "mia@example.com", passwordHash: "demo", totalScore: 720, createdAt: DAYS(60) },
];

function jitter(base: number, range: number): number {
  return base + (Math.random() - 0.5) * range;
}

function speciesByName(name: string) {
  return SPECIES.find((s) => s.speciesName === name)!;
}

/** Spread sightings around Central Park to populate the map nicely. */
export const SEED_SIGHTINGS: Sighting[] = [
  {
    id: "s-1", userId: "u-sara", ...speciesByName("Bald Eagle"),
    imageUrl: "", confidence: 0.94, score: 188, isSuspicious: false,
    lat: jitter(40.7858, 0.01), lng: jitter(-73.9685, 0.01), createdAt: HOURS(2),
  } as any,
  {
    id: "s-2", userId: "u-leo", ...speciesByName("Red Fox"),
    imageUrl: "", confidence: 0.88, score: 138, isSuspicious: false,
    lat: jitter(40.7820, 0.01), lng: jitter(-73.9710, 0.01), createdAt: HOURS(5),
  } as any,
  {
    id: "s-3", userId: "u-ava", ...speciesByName("Monarch Butterfly"),
    imageUrl: "", confidence: 0.82, score: 132, isSuspicious: false,
    lat: jitter(40.7900, 0.01), lng: jitter(-73.9640, 0.01), createdAt: HOURS(9),
  } as any,
  {
    id: "s-4", userId: "u-marco", ...speciesByName("Eastern Gray Squirrel"),
    imageUrl: "", confidence: 0.96, score: 96, isSuspicious: false,
    lat: jitter(40.7811, 0.008), lng: jitter(-73.9665, 0.008), createdAt: HOURS(14),
  } as any,
  {
    id: "s-5", userId: "u-jin", ...speciesByName("Great Horned Owl"),
    imageUrl: "", confidence: 0.79, score: 32, isSuspicious: true,
    lat: jitter(40.7680, 0.005), lng: jitter(-73.9718, 0.005), createdAt: HOURS(20),
  } as any,
  {
    id: "s-6", userId: "u-mia", ...speciesByName("Mallard Duck"),
    imageUrl: "", confidence: 0.91, score: 91, isSuspicious: false,
    lat: jitter(40.7770, 0.008), lng: jitter(-73.9730, 0.008), createdAt: HOURS(28),
  } as any,
  {
    id: "s-7", userId: "u-sara", ...speciesByName("River Otter"),
    imageUrl: "", confidence: 0.85, score: 185, isSuspicious: false,
    lat: jitter(40.7790, 0.008), lng: jitter(-73.9590, 0.008), createdAt: DAYS(2),
  } as any,
  {
    id: "s-8", userId: "u-leo", ...speciesByName("Luna Moth"),
    imageUrl: "", confidence: 0.76, score: 176, isSuspicious: false,
    lat: jitter(40.7935, 0.008), lng: jitter(-73.9710, 0.008), createdAt: DAYS(3),
  } as any,
  {
    id: "s-9", userId: "u-ava", ...speciesByName("Hummingbird"),
    imageUrl: "", confidence: 0.81, score: 131, isSuspicious: false,
    lat: jitter(40.7860, 0.008), lng: jitter(-73.9760, 0.008), createdAt: DAYS(4),
  } as any,
  {
    id: "s-10", userId: "u-marco", ...speciesByName("Blue Jay"),
    imageUrl: "", confidence: 0.93, score: 93, isSuspicious: false,
    lat: jitter(40.7700, 0.008), lng: jitter(-73.9685, 0.008), createdAt: DAYS(5),
  } as any,
  {
    id: "s-11", userId: "u-mia", ...speciesByName("Honey Bee"),
    imageUrl: "", confidence: 0.88, score: 88, isSuspicious: false,
    lat: jitter(40.7755, 0.008), lng: jitter(-73.9620, 0.008), createdAt: DAYS(6),
  } as any,
  {
    id: "s-12", userId: "u-jin", ...speciesByName("Pacific Tree Frog"),
    imageUrl: "", confidence: 0.84, score: 84, isSuspicious: false,
    lat: jitter(40.7830, 0.008), lng: jitter(-73.9750, 0.008), createdAt: DAYS(7),
  } as any,
];