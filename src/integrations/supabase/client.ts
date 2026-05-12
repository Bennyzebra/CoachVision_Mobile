import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
const FALLBACK_SUPABASE_URL = "http://localhost:54321";
const FALLBACK_SUPABASE_PUBLISHABLE_KEY = "public-anon-key";

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable authentication and data features."
  );
}

const supabaseUrl = isSupabaseConfigured ? SUPABASE_URL : FALLBACK_SUPABASE_URL;
const supabasePublishableKey = isSupabaseConfigured
  ? SUPABASE_PUBLISHABLE_KEY
  : FALLBACK_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
