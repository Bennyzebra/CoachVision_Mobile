type SupabaseEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  VITE_SUPABASE_ANON_KEY?: string;
};

const FALLBACK_SUPABASE_URL = "http://localhost:54321";
const FALLBACK_SUPABASE_KEY = "public-anon-key";

const readEnvValue = (value: string | undefined) => value?.trim() ?? "";

export function resolveSupabaseConfig(env: SupabaseEnv) {
  const url = readEnvValue(env.VITE_SUPABASE_URL);
  const key =
    readEnvValue(env.VITE_SUPABASE_PUBLISHABLE_KEY) ||
    readEnvValue(env.VITE_SUPABASE_ANON_KEY);
  const isConfigured = Boolean(url && key);

  return {
    isConfigured,
    url: isConfigured ? url : FALLBACK_SUPABASE_URL,
    key: isConfigured ? key : FALLBACK_SUPABASE_KEY,
  };
}
