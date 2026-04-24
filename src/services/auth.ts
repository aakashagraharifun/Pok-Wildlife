import type { User } from "@/types";
import {
  getUsers,
  setUsers,
  getSessionUserId,
  setSessionUserId,
  hashPassword,
  newId,
} from "./store";

// TODO: Replace with real Supabase auth (signInWithPassword, signUp, signOut, onAuthStateChange).

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function login(email: string, password: string): Promise<User> {
  await delay(400);
  const users = getUsers();
  const u = users.find((x) => x.email.toLowerCase() === email.toLowerCase());
  if (!u) throw new Error("No account found with that email.");
  if (u.passwordHash !== hashPassword(password) && u.passwordHash !== "demo") {
    throw new Error("Incorrect password.");
  }
  setSessionUserId(u.id);
  return u;
}

export async function register(name: string, email: string, password: string): Promise<User> {
  await delay(500);
  const users = getUsers();
  if (users.some((x) => x.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("An account with that email already exists.");
  }
  const user: User = {
    id: newId("u"),
    name: name.trim(),
    email: email.trim(),
    passwordHash: hashPassword(password),
    totalScore: 0,
    createdAt: new Date().toISOString(),
  };
  setUsers([...users, user]);
  setSessionUserId(user.id);
  return user;
}

export async function logout(): Promise<void> {
  await delay(150);
  setSessionUserId(null);
}

export function getCurrentUser(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) ?? null;
}

export function updateCurrentUserScore(delta: number): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  const users = getUsers();
  const idx = users.findIndex((u) => u.id === id);
  if (idx < 0) return null;
  const updated = { ...users[idx], totalScore: users[idx].totalScore + delta };
  const next = [...users];
  next[idx] = updated;
  setUsers(next);
  return updated;
}