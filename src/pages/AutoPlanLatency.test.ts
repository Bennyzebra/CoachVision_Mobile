import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");

test("AutoPlan sends a capped drill candidate set to practice plan generation", () => {
  assert.match(autoPlanSource, /selectPracticePlanCandidateDrills/);
  assert.match(autoPlanSource, /candidateDrills\s*=\s*selectPracticePlanCandidateDrills/);
  assert.match(autoPlanSource, /generatePracticePlan\(coachRequirements,\s*candidateDrills\)/);
});

test("AutoPlan caches fetched drills for repeated generations in the same session", () => {
  assert.match(autoPlanSource, /generationDrillsCacheRef/);
  assert.match(autoPlanSource, /cachedGenerationDrills/);
  assert.match(autoPlanSource, /generationDrillsCacheRef\.current\s*=\s*\{/);
});

test("AutoPlan Fast Mode skips explain-why generation on the critical path", () => {
  assert.match(autoPlanSource, /const \[fastMode, setFastMode\]/);
  assert.match(autoPlanSource, /defaultFastMode/);
  assert.match(autoPlanSource, /if \(!fastMode\) \{/);
  assert.match(autoPlanSource, /<Switch/);
});

test("AutoPlan reports slow generation status and frontend timing logs", () => {
  assert.match(autoPlanSource, /GENERATION_STILL_WORKING_MS/);
  assert.match(autoPlanSource, /Still working/);
  assert.match(autoPlanSource, /console\.info\("\[AutoPlan\] generation timings"/);
  assert.match(autoPlanSource, /drillsFetchMs/);
  assert.match(autoPlanSource, /planGenerationMs/);
  assert.match(autoPlanSource, /explainWhyMs/);
});
