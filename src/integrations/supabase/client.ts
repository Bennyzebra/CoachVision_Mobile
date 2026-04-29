import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const FALLBACK_SUPABASE_URL = "http://localhost:54321";
const FALLBACK_SUPABASE_ANON_KEY = "public-anon-key";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication and data features."
  );
}

const supabaseUrl = isSupabaseConfigured ? SUPABASE_URL : FALLBACK_SUPABASE_URL;
const supabaseAnonKey = isSupabaseConfigured
  ? SUPABASE_ANON_KEY
  : FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});