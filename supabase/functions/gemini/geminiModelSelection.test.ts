import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const geminiFunctionSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

test("Gemini edge function defaults to gemini-2.5-flash-lite", () => {
  assert.match(geminiFunctionSource, /gemini-2\.5-flash-lite/);
});
