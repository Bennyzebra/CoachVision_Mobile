import { strict as assert } from "node:assert";
import { test } from "node:test";

import { getAuthErrorMessage, isSupabaseConnectivityError } from "./supabaseAuthError.ts";

test("identifies Supabase status-zero failures as connectivity errors", () => {
  const error = Object.assign(new Error("Load failed"), {
    name: "AuthRetryableFetchError",
    status: 0,
  });

  assert.equal(isSupabaseConnectivityError(error), true);
  assert.equal(
    getAuthErrorMessage(error, "Authentication failed."),
    "Couldn't reach Supabase. Check the project URL, internet connection, and any VPN, proxy, or DNS filter."
  );
});

test("preserves Supabase authentication errors", () => {
  const error = new Error("Invalid login credentials");

  assert.equal(isSupabaseConnectivityError(error), false);
  assert.equal(
    getAuthErrorMessage(error, "Authentication failed."),
    "Invalid login credentials"
  );
});
