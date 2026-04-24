import type { User } from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * Log in using Supabase Auth.
 */
export async function login(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.user) throw new Error("Login failed");

  // Fetch user profile from public.profiles or similar
  const { data: profile, error: pError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (pError || !profile) {
    return {
      id: data.user.id,
      name: data.user.email?.split("@")[0] || "User",
      email: data.user.email || "",
      passwordHash: "managed",
      totalScore: 0,
      createdAt: data.user.created_at,
    };
  }

  return mapProfile(profile);
}

/**
 * Register using Supabase Auth.
 */
export async function register(
  name: string, 
  email: string, 
  password: string
): Promise<{ user: User; session: any }> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error("Registration failed");

  const newUser: User = {
    id: data.user.id,
    name,
    email,
    passwordHash: "managed",
    totalScore: 0,
    createdAt: data.user.created_at,
  };

  // Profile is created by DB trigger in SQL, 
  // but we can ensure it exists here too if needed.
  
  return { user: newUser, session: data.session };
}

/**
 * Log out from Supabase.
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Get the current session user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!profile) return null;
  return mapProfile(profile);
}

/**
 * Updates score in Supabase.
 */
export async function updateCurrentUserScore(delta: number): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("total_score")
    .eq("id", session.user.id)
    .single();

  if (profile) {
    await supabase
      .from("profiles")
      .update({ total_score: (profile.total_score || 0) + delta })
      .eq("id", session.user.id);
  }
}

/**
 * Update user profile details.
 */
export async function updateProfile(updates: { name?: string; avatarUrl?: string }): Promise<User> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .update({
      name: updates.name,
      avatar_url: updates.avatarUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.user.id)
    .select()
    .single();

  if (error) throw error;
  return mapProfile(data);
}

function mapProfile(p: any): User {
  return {
    id: p.id,
    name: p.name,
    email: p.email,
    passwordHash: "managed",
    totalScore: p.total_score || 0,
    createdAt: p.created_at,
  };
}
