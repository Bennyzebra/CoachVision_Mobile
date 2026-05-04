import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const actionContextSource = readFileSync(new URL("./MobileBottomActionContext.tsx", import.meta.url), "utf8");
const autoPlanSource = readFileSync(new URL("../pages/AutoPlan.tsx", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("./Layout.tsx", import.meta.url), "utf8");
const searchBarSource = readFileSync(new URL("./SearchBar.tsx", import.meta.url), "utf8");

test("AutoPlan registers the generated plan save action with Layout", () => {
  assert.match(actionContextSource, /registerMobileBottomAction/);
  assert.match(actionContextSource, /MobileBottomActionRegistration/);
  assert.match(layoutSource, /MobileBottomActionContext\.Provider/);
  assert.match(autoPlanSource, /useMobileBottomAction/);
  assert.match(autoPlanSource, /active: Boolean\(generatedPlan\)/);
  assert.match(autoPlanSource, /label: "Save and Continue to Practice"/);
  assert.match(autoPlanSource, /compactLabel: "Continue to practice"/);
  assert.match(autoPlanSource, /onClick: handleSaveAndContinue/);
});

test("SearchBar renders compact and expanded generated-plan bottom states", () => {
  assert.match(searchBarSource, /useMobileBottomAction/);
  assert.match(searchBarSource, /isGeneratedPlanActionActive/);
  assert.match(searchBarSource, /generatedPlanNavExpanded/);
  assert.match(searchBarSource, /setGeneratedPlanNavExpanded\(true\)/);
  assert.match(searchBarSource, /setGeneratedPlanNavExpanded\(false\)/);
  assert.match(searchBarSource, /onAutoPlanIconClick: \(\) => setGeneratedPlanNavExpanded\(false\)/);
  assert.match(searchBarSource, /Save and Continue to Practice/);
  assert.match(searchBarSource, /Continue to practice/);
  assert.match(searchBarSource, /<Play className=/);
  assert.match(searchBarSource, /<Loader2 className=/);
  assert.match(searchBarSource, /window\.addEventListener\("scroll", collapseGeneratedPlanNav/);
  assert.match(searchBarSource, /window\.addEventListener\("touchmove", collapseGeneratedPlanNav/);
  assert.match(searchBarSource, /420ms cubic-bezier\(0\.22, 1, 0\.36, 1\)/);
});

test("SearchBar anchors the generated-plan save button to the right while it expands", () => {
  assert.match(searchBarSource, /absolute right-0 top-0/);
  assert.match(searchBarSource, /width: generatedPlanNavExpanded \? "3rem" : "calc\(100% - 3\.75rem\)"/);
});
