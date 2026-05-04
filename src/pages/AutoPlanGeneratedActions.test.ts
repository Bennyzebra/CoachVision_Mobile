import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");

test("AutoPlan generated plan actions show create and export icon buttons", () => {
  assert.match(autoPlanSource, /PlusCircle/);
  assert.match(autoPlanSource, /Download/);
  assert.match(autoPlanSource, /Create New Plan/);
  assert.match(autoPlanSource, /Export/);
});

test("AutoPlan shows a focused generation overlay with progress and revision controls", () => {
  assert.match(autoPlanSource, /createPortal/);
  assert.match(autoPlanSource, /document\.body/);
  assert.match(autoPlanSource, /Generating practice plan/);
  assert.match(autoPlanSource, /role="progressbar"/);
  assert.match(autoPlanSource, /generationProgress/);
  assert.match(autoPlanSource, /handleCancelGeneration/);
  assert.match(autoPlanSource, /handleReviseGeneration/);
  assert.match(autoPlanSource, /Cancel/);
  assert.match(autoPlanSource, /Revise/);
  assert.match(autoPlanSource, /backdrop-blur/);
  assert.doesNotMatch(autoPlanSource, /mx-auto flex h-12 w-12[\s\S]*?<Sparkles className="h-6 w-6"/);
});
