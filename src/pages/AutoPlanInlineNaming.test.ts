import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");

test("AutoPlan uses inline generated practice naming instead of the title sheet", () => {
  assert.doesNotMatch(autoPlanSource, /SheetTrigger/);
  assert.doesNotMatch(autoPlanSource, /Edit Practice Name/);
  assert.doesNotMatch(autoPlanSource, /Name Your Practice/);
  assert.match(autoPlanSource, /Name practice/);
  assert.match(autoPlanSource, /isEditingPracticeTitle/);
  assert.match(autoPlanSource, /enterKeyHint="done"/);
});

test("AutoPlan commits inline practice title on blur or Enter and cancels on Escape", () => {
  assert.match(autoPlanSource, /commitPracticeTitle/);
  assert.match(autoPlanSource, /onBlur=\{commitPracticeTitle\}/);
  assert.match(autoPlanSource, /event\.key === "Enter"[\s\S]*commitPracticeTitle/);
  assert.match(autoPlanSource, /event\.key === "Escape"[\s\S]*cancelPracticeTitleEdit/);
});

test("AutoPlan keeps generated practice title persistence and save wiring", () => {
  assert.match(autoPlanSource, /GENERATED_PLAN_TITLE_STORAGE_KEY/);
  assert.match(autoPlanSource, /window\.sessionStorage\.setItem\(GENERATED_PLAN_TITLE_STORAGE_KEY,\s*practiceTitle\.trim\(\)\)/);
  assert.match(autoPlanSource, /window\.sessionStorage\.removeItem\(GENERATED_PLAN_TITLE_STORAGE_KEY\)/);
  assert.match(autoPlanSource, /savePractice\([\s\S]*practiceTitle[\s\S]*\)/);
});
