import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import { resolveSupabaseConfig } from "./config";

const supabaseConfig = resolveSupabaseConfig(import.meta.env);

export const isSupabaseConfigured = supabaseConfig.isConfigured;

if (!isSupabaseConfigured) {
  console.warn(
    "Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable authentication and data features. VITE_SUPABASE_ANON_KEY is still supported for older local env files."
  );
}

export const supabase = createClient<Database>(supabaseConfig.url, supabaseConfig.key, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
