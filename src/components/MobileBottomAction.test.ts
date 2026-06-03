import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const actionContextSource = readFileSync(new URL("./MobileBottomActionContext.tsx", import.meta.url), "utf8");
const autoPlanSource = readFileSync(new URL("../pages/AutoPlan.tsx", import.meta.url), "utf8");
const runPracticeSource = readFileSync(new URL("../pages/RunPractice.tsx", import.meta.url), "utf8");
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

test("Mobile bottom actions support a segmented run-practice control bar", () => {
  assert.match(actionContextSource, /MobileBottomSegmentedActionRegistration/);
  assert.match(actionContextSource, /id\?: string/);
  assert.match(actionContextSource, /variant: "segmented"/);
  assert.match(actionContextSource, /segments: MobileBottomSegmentedAction\[\]/);
  assert.match(actionContextSource, /activeSegmentIndex\?: number/);
  assert.match(actionContextSource, /swipeEnabled\?: boolean/);
  assert.match(actionContextSource, /onSwipeLeftToRight\?: \(\) => void/);
  assert.match(actionContextSource, /onSwipeRightToLeft\?: \(\) => void/);
  assert.match(searchBarSource, /isSegmentedActionActive/);
  assert.match(searchBarSource, /mobileBottomAction\.segments\.map/);
  assert.match(searchBarSource, /segment\.primary/);
});

test("RunPractice wires segmented swipe gestures to previous and next drills", () => {
  assert.match(runPracticeSource, /activeSegmentIndex: 1/);
  assert.match(runPracticeSource, /id: "timer-toggle"/);
  assert.match(runPracticeSource, /swipeEnabled: totalTimeRemaining > 0 && !isAnimating/);
  assert.match(runPracticeSource, /onSwipeLeftToRight: handleNextDrill/);
  assert.match(runPracticeSource, /onSwipeRightToLeft: handlePreviousDrill/);
  assert.doesNotMatch(runPracticeSource, /onSwipeLeftToRight: handlePreviousDrill/);
  assert.doesNotMatch(runPracticeSource, /onSwipeRightToLeft: handleNextDrill/);
});

test("SearchBar segmented controls render a movable swipe highlight", () => {
  assert.match(searchBarSource, /segmentedSwipeTargetIndex/);
  assert.match(searchBarSource, /segmentedHighlightStyle/);
  assert.match(searchBarSource, /translate3d\(\$\{segmentedHighlightStyle\.x\}px, 0, 0\)/);
  assert.match(searchBarSource, /absolute top-1 h-10 rounded-full bg-\[#168dff\]/);
  assert.match(searchBarSource, /isSeparatorCoveredByHighlight/);
  assert.match(searchBarSource, /opacity-0/);
  assert.doesNotMatch(searchBarSource, /segment\.primary\s*\? "bg-\[#168dff\] text-white shadow-sm hover:bg-\[#0f7ee6\]"/);
});

test("SearchBar segmented swipe detects horizontal intent and triggers drill navigation", () => {
  assert.match(searchBarSource, /SEGMENTED_SWIPE_DEADZONE_PX/);
  assert.match(searchBarSource, /SEGMENTED_SWIPE_THRESHOLD_PX/);
  assert.match(searchBarSource, /segmentedSwipeIntentRef/);
  assert.match(searchBarSource, /handleSegmentedPointerDown/);
  assert.match(searchBarSource, /handleSegmentedPointerMove/);
  assert.match(searchBarSource, /handleSegmentedPointerEnd/);
  assert.match(searchBarSource, /getSegmentedVisualTargetIndex/);
  assert.match(searchBarSource, /getSegmentedActionTargetIndex/);
  assert.match(searchBarSource, /const targetIndex = segmentedActiveSegmentIndex \+ \(deltaX > 0 \? 1 : -1\)/);
  assert.doesNotMatch(searchBarSource, /const targetIndex = segmentedActiveSegmentIndex \+ \(deltaX > 0 \? -1 : 1\)/);
  assert.match(searchBarSource, /mobileBottomAction\.onSwipeLeftToRight\?\.\(\)/);
  assert.match(searchBarSource, /mobileBottomAction\.onSwipeRightToLeft\?\.\(\)/);
});

test("Run-practice Next control renders its icon after the label", () => {
  assert.match(searchBarSource, /segment\.label === "Next" \? \(/);
  assert.match(
    searchBarSource,
    /segment\.label === "Next" \? \([\s\S]*?<AnimatedSegmentContent segment=\{segment\} iconAfterLabel \/>/
  );
  assert.match(
    searchBarSource,
    /if \(iconAfterLabel\) \{[\s\S]*?\{label\}[\s\S]*?\{content\.icon\}/
  );
  assert.match(
    searchBarSource,
    /return \([\s\S]*?\{content\.icon\}[\s\S]*?\{label\}/
  );
});

test("Run-practice segmented controls keep the standard mobile bottom bar height", () => {
  assert.doesNotMatch(layoutSource, /isRunPracticeRoute && "h-28 items-start pt-5"/);
  assert.doesNotMatch(layoutSource, /isRunPracticeRoute && "pb-\[calc\(9rem\+var\(--app-safe-area-bottom\)\)\]/);
  assert.match(searchBarSource, /flex h-12 w-\[19rem\]/);
  assert.match(searchBarSource, /key=\{segment\.id \?\? segment\.label\}/);
  assert.match(searchBarSource, /active:scale-\[0\.96\]/);
  assert.match(searchBarSource, /transition-\[transform,color,background-color\]/);
  assert.match(searchBarSource, /duration-150/);
  assert.match(searchBarSource, /motion-reduce:transition-none/);
  assert.match(searchBarSource, /segment\.primary[\s\S]*flex-\[1\.08\]/);
  assert.match(searchBarSource, /segment\.primary[\s\S]*flex-\[0\.96\]/);
});

test("SearchBar segmented timer content changes with a soft transition", () => {
  assert.match(searchBarSource, /key=\{segment\.compactLabel \?\? segment\.label\}/);
  assert.match(searchBarSource, /transition-all duration-150 ease-out/);
  assert.match(searchBarSource, /group-active:scale-95/);
  assert.match(searchBarSource, /motion-reduce:transition-none/);
});

test("Run-practice segmented navigation uses transient pressed styling instead of sticky mobile hover", () => {
  const segmentedControlSource = searchBarSource.match(
    /if \(isSegmentedActionActive && mobileBottomAction\?\.variant === "segmented"\) \{[\s\S]*?if \(isGeneratedPlanActionActive/
  )?.[0];

  assert.ok(segmentedControlSource);
  assert.doesNotMatch(segmentedControlSource, /hover:bg-background\/50/);
  assert.match(segmentedControlSource, /active:bg-background\/50/);
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
  assert.match(searchBarSource, /setSegmentedSwipeTargetIndex\(null\)/);
  assert.match(
    searchBarSource,
    /useEffect\(\(\) => {\s+resetBarInteractionState\(\);\s+}, \[isMobilePagerEnabled, isSegmentedActionActive, location\.pathname, resetBarInteractionState\]\)/
  );
});

test("SearchBar rebinds width measurement when the rendered container node changes", () => {
  assert.match(searchBarSource, /const setContainerNode = useCallback/);
  assert.match(searchBarSource, /containerResizeObserverRef/);
  assert.match(searchBarSource, /containerResizeObserverRef\.current\?\.disconnect\(\)/);
  assert.match(searchBarSource, /setContainerWidth\(node\.clientWidth\)/);
  assert.match(searchBarSource, /ref=\{setContainerNode\}/);
});
