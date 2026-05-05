import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");

test("AutoPlan wires GeneratedPlan reorders back into the live generated plan state", () => {
  assert.match(autoPlanSource, /const handleGeneratedPlanReorder = useCallback\(/);
  assert.match(
    autoPlanSource,
    /updatedSegments: Pick<GeneratedPracticePlan, "warmup" \| "main_segment" \| "cool_down">/
  );
  assert.match(autoPlanSource, /setGeneratedPlan\(\(currentPlan\) => \{/);
  assert.match(autoPlanSource, /if \(!currentPlan\) return currentPlan;/);
  assert.match(autoPlanSource, /return \{\s*\.\.\.currentPlan,\s*\.\.\.updatedSegments,\s*\};/s);
  assert.match(autoPlanSource, /<GeneratedPlan[\s\S]*onReorder=\{handleGeneratedPlanReorder\}/);
});

test("AutoPlan persists generated plan edits through storage and save", () => {
  assert.match(autoPlanSource, /GENERATED_PLAN_STORAGE_KEY/);
  assert.match(
    autoPlanSource,
    /window\.sessionStorage\.setItem\(\s*GENERATED_PLAN_STORAGE_KEY,\s*JSON\.stringify\(generatedPlan\)\s*\)/
  );
  assert.match(autoPlanSource, /savePractice\([\s\S]*generatedPlan[\s\S]*practiceTitle[\s\S]*\)/);
});
