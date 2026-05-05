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

test("AutoPlan export view matches the generated practice export mockup structure", () => {
  assert.match(autoPlanSource, /isGeneratedPlanExportView/);
  assert.match(autoPlanSource, /formatPracticeExportDate/);
  assert.match(autoPlanSource, /formatPracticeExportMonthDate/);
  assert.match(autoPlanSource, /PRACTICE DESCRIPTION/);
  assert.match(autoPlanSource, /Print/);
  assert.match(autoPlanSource, /Download PDF/);
  assert.match(autoPlanSource, /Share/);
  assert.match(autoPlanSource, /Practice Length/);
  assert.match(autoPlanSource, /Focus Intensity/);
  assert.match(autoPlanSource, /handlePrintPracticePlan/);
  assert.match(autoPlanSource, /handleDownloadPracticePdf/);
  assert.match(autoPlanSource, /handleSharePracticePlan/);
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

test("AutoPlan cancellation aborts the active generation request", () => {
  assert.match(autoPlanSource, /generationAbortControllerRef/);
  assert.match(autoPlanSource, /generationAbortControllerRef\.current\?\.abort\(\)/);
  assert.match(autoPlanSource, /new AbortController\(\)/);
  assert.match(autoPlanSource, /generatePracticePlan\([\s\S]*signal:\s*abortController\.signal/);
  assert.match(autoPlanSource, /generateDrillExplainWhys\([\s\S]*signal:\s*abortController\.signal/);
});
