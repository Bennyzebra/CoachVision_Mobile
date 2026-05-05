import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const geminiFunctionSource = readFileSync(new URL("./index.ts", import.meta.url), "utf8");

test("Gemini edge function passes request abort signals into model calls", () => {
  assert.match(geminiFunctionSource, /generateContentJson\s*=\s*async\s*\(\s*prompt:\s*string,\s*signal\?:\s*AbortSignal/);
  assert.match(geminiFunctionSource, /generateContent\(prompt,\s*\{\s*signal\s*\}\)/);
  assert.match(geminiFunctionSource, /handleGeneratePracticePlan\(payload,\s*authorization,\s*req\.signal\)/);
  assert.match(geminiFunctionSource, /handleGenerateDrillExplainWhys\(payload,\s*req\.signal\)/);
});
