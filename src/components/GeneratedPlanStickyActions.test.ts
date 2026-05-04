import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const generatedPlanSource = readFileSync(new URL("./GeneratedPlan.tsx", import.meta.url), "utf8");

test("GeneratedPlan leaves mobile save action ownership to the bottom bar", () => {
  assert.doesNotMatch(generatedPlanSource, /import \{ createPortal \} from "react-dom";/);
  assert.doesNotMatch(generatedPlanSource, /createPortal\(/);
  assert.doesNotMatch(generatedPlanSource, /mobileSaveAction/);
  assert.doesNotMatch(generatedPlanSource, /pb-\[calc\(5\.75rem\+var\(--app-safe-area-bottom\)\)\]/);
  assert.doesNotMatch(generatedPlanSource, /fixed inset-x-0 bottom-\[calc\(4rem\+var\(--app-safe-area-bottom\)\)\]/);
  assert.match(generatedPlanSource, /onSaveAndContinue\?: \(\) => void;/);
  assert.match(generatedPlanSource, /isSaving\?: boolean;/);
});
