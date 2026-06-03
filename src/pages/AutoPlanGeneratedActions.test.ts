import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");

test("AutoPlan generated plan actions show create and native share export buttons", () => {
  assert.match(autoPlanSource, /PlusCircle/);
  assert.match(autoPlanSource, /Share2/);
  assert.match(autoPlanSource, /Create New Plan/);
  assert.match(autoPlanSource, /Export/);
});

test("AutoPlan practice overview Export button opens the native share flow directly", () => {
  assert.match(autoPlanSource, /formatPracticeExportDate/);
  assert.match(autoPlanSource, /formatPracticeExportMonthDate/);
  assert.match(autoPlanSource, /handleSharePracticePlan/);
  assert.match(
    autoPlanSource,
    /<Button[\s\S]*?onClick=\{handleSharePracticePlan\}[\s\S]*?<Share2 className="h-4 w-4" \/>[\s\S]*?Export[\s\S]*?<\/Button>/
  );
  assert.doesNotMatch(autoPlanSource, /setIsGeneratedPlanExportView\(true\)/);
  assert.doesNotMatch(autoPlanSource, /handlePrintPracticePlan/);
  assert.doesNotMatch(autoPlanSource, /handleDownloadPracticePdf/);
  assert.doesNotMatch(autoPlanSource, /Download PDF/);
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

test("AutoPlan has a temporary demo plan bypass that avoids Gemini generation calls", () => {
  assert.match(autoPlanSource, /TEMP_DEMO_PLAN_BYPASS_ENABLED/);
  assert.match(autoPlanSource, /const generateDemoPlan = \(\) => \{/);
  assert.match(autoPlanSource, /demoDrills/);
  assert.match(autoPlanSource, /onClick=\{generateDemoPlan\}/);
  assert.match(autoPlanSource, /Use Demo Drills/);

  const demoHandlerStart = autoPlanSource.indexOf("const generateDemoPlan = () => {");
  const realGeneratorStart = autoPlanSource.indexOf("const generatePlan = async () => {");
  assert.notEqual(demoHandlerStart, -1);
  assert.notEqual(realGeneratorStart, -1);

  const demoHandlerSource = autoPlanSource.slice(demoHandlerStart, realGeneratorStart);
  assert.doesNotMatch(demoHandlerSource, /generatePracticePlan\(/);
  assert.doesNotMatch(demoHandlerSource, /generateDrillExplainWhys\(/);
});

test("AutoPlan demo plan setup preserves a chosen practice title", () => {
  assert.match(
    autoPlanSource,
    /setPracticeTitle\(\(currentTitle\) => currentTitle\.trim\(\) \|\| "Practice"\);/
  );
  assert.doesNotMatch(autoPlanSource, /setPracticeTitle\("Demo Practice Plan"\);/);
});
