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
  assert.match(autoPlanSource, /label: "Save and Continue to Practice"/);
  assert.match(autoPlanSource, /compactLabel: "Continue to practice"/);
  assert.match(autoPlanSource, /onClick: handleSaveAndContinue/);
});

test("AutoPlan only registers the generated plan action while the generated practice page is active", () => {
  assert.match(autoPlanSource, /useLocation/);
  assert.match(
    autoPlanSource,
    /const isGeneratedPlanBottomActionVisible =\s+Boolean\(generatedPlan\) && location\.pathname === "\/"/
  );
  assert.match(
    autoPlanSource,
    /registerMobileBottomAction\(\s+isGeneratedPlanBottomActionVisible\s+\?/
  );
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

test("SearchBar keeps the mobile pager pill fixed-size but clips swipe motion at the display edge", () => {
  assert.doesNotMatch(
    searchBarSource,
    /relative h-12 w-\[19rem\] max-w-\[calc\(100vw-2rem\)\] touch-pan-y overflow-hidden/
  );
  assert.match(searchBarSource, /h-12 w-screen touch-pan-y overflow-hidden/);
  assert.match(searchBarSource, /h-12 w-\[19rem\] max-w-\[calc\(100vw-2rem\)\]/);
});

test("SearchBar hides the inactive mobile pager pill while preserving the swipe track", () => {
  assert.match(searchBarSource, /transition-opacity/);
  assert.match(searchBarSource, /isActiveTarget \? "opacity-100" : "pointer-events-none opacity-0"/);
});

test("SearchBar resets transient drag state when the route or pager mode changes", () => {
  assert.match(searchBarSource, /const resetBarInteractionState = useCallback/);
  assert.match(searchBarSource, /setMobilePagerDragOffset\(null\)/);
  assert.match(searchBarSource, /useEffect\(\(\) => {\s+resetBarInteractionState\(\);\s+}, \[isMobilePagerEnabled, location\.pathname, resetBarInteractionState\]\)/);
});

test("SearchBar rebinds width measurement when the rendered container node changes", () => {
  assert.match(searchBarSource, /const setContainerNode = useCallback/);
  assert.match(searchBarSource, /containerResizeObserverRef/);
  assert.match(searchBarSource, /containerResizeObserverRef\.current\?\.disconnect\(\)/);
  assert.match(searchBarSource, /setContainerWidth\(node\.clientWidth\)/);
  assert.match(searchBarSource, /ref=\{setContainerNode\}/);
});
