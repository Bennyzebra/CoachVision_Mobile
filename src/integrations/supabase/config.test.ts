import { strict as assert } from "node:assert";
import { test } from "node:test";
import { resolveSupabaseConfig } from "./config.ts";

test("Supabase config prefers the publishable key", () => {
  const config = resolveSupabaseConfig({
    VITE_SUPABASE_URL: "https://example.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    VITE_SUPABASE_ANON_KEY: "legacy-anon-key",
  });

  assert.equal(config.isConfigured, true);
  assert.equal(config.url, "https://example.supabase.co");
  assert.equal(config.key, "publishable-key");
});

test("Supabase config accepts the legacy anon key name", () => {
  const config = resolveSupabaseConfig({
    VITE_SUPABASE_URL: "https://example.supabase.co",
    VITE_SUPABASE_ANON_KEY: "legacy-anon-key",
  });

  assert.equal(config.isConfigured, true);
  assert.equal(config.url, "https://example.supabase.co");
  assert.equal(config.key, "legacy-anon-key");
});

test("Supabase config is not configured without a URL and browser-safe key", () => {
  const config = resolveSupabaseConfig({
    VITE_SUPABASE_URL: "https://example.supabase.co",
  });

  assert.equal(config.isConfigured, false);
});
