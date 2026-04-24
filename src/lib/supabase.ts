import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Auth and Database will not function correctly.");
}

// Ensure the URL is valid or fallback to a safe placeholder to avoid crash
const validUrl = (url?: string) => {
  if (!url) return "https://placeholder.supabase.co";
  try {
    new URL(url);
    return url;
  } catch (e) {
    console.error("Invalid VITE_SUPABASE_URL:", url);
    return "https://placeholder.supabase.co";
  }
};

export const supabase = createClient(
  validUrl(supabaseUrl),
  supabaseAnonKey || "placeholder"
);
