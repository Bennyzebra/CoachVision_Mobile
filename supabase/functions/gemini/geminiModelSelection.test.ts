import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const geminiFunctionSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

test("Gemini edge function defaults to gemini-2.5-flash-lite", () => {
  assert.match(geminiFunctionSource, /gemini-2\.5-flash-lite/);
});

test("Gemini edge function rejects malformed model overrides with a clear error", () => {
  assert.match(geminiFunctionSource, /looks like an API key/);
  assert.match(geminiFunctionSource, /must be a Gemini model id, not a display label/);
});
