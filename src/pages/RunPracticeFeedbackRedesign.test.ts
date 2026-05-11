import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const runPracticeSource = readFileSync(new URL("./RunPractice.tsx", import.meta.url), "utf8");

test("RunPractice renders the redesigned post-practice feedback shell", () => {
  assert.match(runPracticeSource, /How was practice\?/);
  assert.match(runPracticeSource, /overallStarRating/);
  assert.match(runPracticeSource, /overallEngagement/);
  assert.match(runPracticeSource, /Add note/);
  assert.doesNotMatch(runPracticeSource, /Rate this practice plan/);
  assert.doesNotMatch(runPracticeSource, /<Slider/);
});

test("RunPractice keeps redesigned feedback local-only for this UX pass", () => {
  assert.doesNotMatch(runPracticeSource, /updatePracticeFeedback/);
  assert.doesNotMatch(runPracticeSource, /PracticeDrillOutcome/);
  assert.match(runPracticeSource, /Feedback saved locally for now/);
});

test("RunPractice supports per-drill quick ratings, expansion, and segment grouping", () => {
  assert.match(runPracticeSource, /expandedDrillKey/);
  assert.match(runPracticeSource, /drillFeedbackByKey/);
  assert.match(runPracticeSource, /getSegmentedFeedbackDrills/);
  assert.match(runPracticeSource, /ThumbsDown/);
  assert.match(runPracticeSource, /ThumbsUp/);
  assert.match(runPracticeSource, /add feedback/);
  assert.match(runPracticeSource, /Great/);
});

test("RunPractice feedback panel follows the app-native visual refinement", () => {
  assert.doesNotMatch(runPracticeSource, /radial-gradient/);
  assert.doesNotMatch(runPracticeSource, /shadow-\[0_24px_80px/);
  assert.doesNotMatch(runPracticeSource, /tap-target/);
  assert.doesNotMatch(runPracticeSource, /bg-card text-card-foreground/);
  assert.doesNotMatch(runPracticeSource, /bg-\[#168dff\]/);
  assert.doesNotMatch(runPracticeSource, /hover:bg-\[#0f7ee6\]/);
  assert.match(runPracticeSource, /bg-background text-foreground/);
  assert.match(runPracticeSource, /border-border bg-card text-muted-foreground/);
  assert.match(runPracticeSource, /overflow-hidden rounded-\[8px\] border bg-card transition/);
  assert.match(runPracticeSource, /bg-primary text-primary-foreground hover:bg-primary\/90/);
  assert.doesNotMatch(runPracticeSource, /ref=\{feedbackRef\} className="-mx-4/);
  assert.match(runPracticeSource, /ref=\{feedbackRef\}[\s\S]*?w-full max-w-full overflow-x-hidden overscroll-x-none touch-pan-y/);
  assert.match(runPracticeSource, /pb-\[env\(safe-area-inset-bottom\)\]/);
  assert.doesNotMatch(runPracticeSource, /pb-\[calc\(2rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.doesNotMatch(runPracticeSource, /pb-\[calc\(6rem\+env\(safe-area-inset-bottom\)\)\]/);
  assert.match(runPracticeSource, /whitespace-nowrap/);
  assert.match(runPracticeSource, /line-clamp-2/);
  assert.doesNotMatch(runPracticeSource, /<h4 className="truncate/);
  assert.match(runPracticeSource, /h-12 rounded-full/);
  assert.match(runPracticeSource, /h-9 w-9/);
});

test("RunPractice live view follows the mobile sketch hierarchy", () => {
  assert.doesNotMatch(runPracticeSource, /Total Timer/);
  assert.doesNotMatch(runPracticeSource, /Drill-by-Drill/);
  assert.doesNotMatch(runPracticeSource, /Segmented Progress Bar with Glow Effect/);
  assert.match(runPracticeSource, /practiceDisplayTitle/);
  assert.match(runPracticeSource, /practice\.title\?\.trim\(\) \|\| "Practice"/);
  assert.doesNotMatch(runPracticeSource, /scheduled_date \|\| practice\.created_at/);
  assert.doesNotMatch(runPracticeSource, /new Intl\.DateTimeFormat/);
  assert.match(runPracticeSource, /\$\{totalDurationMinutes\} min/);
  assert.match(runPracticeSource, /currentDrillFocusLabel/);
  assert.match(runPracticeSource, /remaining/);
  assert.match(runPracticeSource, /Next:/);
  assert.match(runPracticeSource, /elapsedPracticeMilliseconds/);
  assert.match(runPracticeSource, /formatElapsedClock/);
  assert.match(runPracticeSource, /isDrillDetailsOpen/);
});

test("RunPractice places a muted circular back chevron above the practice title", () => {
  assert.match(runPracticeSource, /aria-label="Go back"/);
  assert.match(runPracticeSource, /onClick=\{\(\) => navigate\(-1\)\}/);
  assert.match(runPracticeSource, /relative mt-8 grid grid-cols-\[minmax\(0,1fr\)_auto\][\s\S]*?pb-1 pt-4/);
  assert.match(runPracticeSource, /absolute -top-8 left-0 flex h-10 w-10/);
  assert.match(runPracticeSource, /className="mt-5 h-2\.5 overflow-hidden rounded-full bg-muted\/70"/);
  assert.match(runPracticeSource, /border border-border bg-muted\/35 text-muted-foreground/);
  assert.match(runPracticeSource, /<ChevronLeft className="h-5 w-5" \/>/);
  assert.ok(
    runPracticeSource.indexOf('aria-label="Go back"') <
      runPracticeSource.indexOf("{practiceDisplayTitle}"),
    "Back chevron should render before the practice title"
  );
});

test("RunPractice lets feedback scroll while keeping closed live practice locked", () => {
  assert.match(runPracticeSource, /const isRunContentScrollable = showFeedback \|\| isDrillDetailsOpen \|\| isNextPreviewOpen/);
  assert.match(runPracticeSource, /h-\[calc\(100dvh-var\(--app-safe-area-top\)-4\.75rem-var\(--app-safe-area-bottom\)\)\]/);
  assert.match(runPracticeSource, /w-full max-w-md overflow-x-hidden overscroll-x-none scrollbar-none text-foreground/);
  assert.match(runPracticeSource, /isRunContentScrollable \? "overflow-y-auto pb-2" : "overflow-hidden pb-0"/);
  assert.match(runPracticeSource, /showFeedback && "touch-pan-y"/);
  assert.doesNotMatch(runPracticeSource, /<div className="mx-auto max-w-md pb-2 text-foreground">/);
});

test("RunPractice clamps feedback mode to vertical-only panning", () => {
  assert.match(runPracticeSource, /showFeedback && \(/);
  assert.match(
    runPracticeSource,
    /<div[\s\S]*?ref=\{feedbackRef\}[\s\S]*?className="w-full max-w-full overflow-x-hidden overscroll-x-none touch-pan-y pb-\[env\(safe-area-inset-bottom\)\]"/
  );
  assert.match(
    runPracticeSource,
    /<section className="w-full max-w-full overflow-hidden bg-background text-foreground">/
  );
  assert.doesNotMatch(
    runPracticeSource,
    /className="-mx-4 pb-\[calc\([^"]+\)\] sm:-mx-6 md:mx-0"/
  );
});

test("RunPractice feedback mode registers Return and Save bottom actions", () => {
  assert.match(runPracticeSource, /const handleReturnFromFeedback = useCallback\(\(\) => \{/);
  assert.match(runPracticeSource, /setShowFeedback\(false\);/);
  assert.match(runPracticeSource, /const handleSaveFeedbackAndExit = useCallback\(\(\) => \{/);
  assert.match(runPracticeSource, /handleLocalFeedbackSave\(\);/);
  assert.match(runPracticeSource, /navigate\("\/"\);/);
  assert.match(runPracticeSource, /if \(showFeedback\) \{[\s\S]*variant: "segmented"[\s\S]*swipeEnabled: false[\s\S]*id: "feedback-return"[\s\S]*label: "Return"[\s\S]*onClick: handleReturnFromFeedback[\s\S]*id: "feedback-save"[\s\S]*label: "Save"[\s\S]*onClick: handleSaveFeedbackAndExit/);
  assert.doesNotMatch(runPracticeSource, /Save Feedback/);
});

test("RunPractice next drill preview leaves room for descenders", () => {
  assert.match(runPracticeSource, /min-w-0 flex-1 truncate text-\[1\.55rem\] leading-\[1\.2\] text-muted-foreground/);
  assert.doesNotMatch(runPracticeSource, /min-w-0 flex-1 truncate text-\[1\.55rem\] leading-none text-muted-foreground/);
});

test("RunPractice keeps the live drill title, quick tags, and countdown horizontally fitted", () => {
  assert.match(runPracticeSource, /PRACTICE_TITLE_FONT_SIZE_REM = 2/);
  assert.match(runPracticeSource, /DEFAULT_DRILL_TITLE_FONT_SIZE_REM = 2\.8/);
  assert.match(runPracticeSource, /drillTitleContainerRef = useRef<HTMLDivElement \| null>\(null\)/);
  assert.match(runPracticeSource, /drillTitleMeasureRef = useRef<HTMLSpanElement \| null>\(null\)/);
  assert.match(runPracticeSource, /new ResizeObserver\(fitDrillTitleToAvailableWidth\)/);
  assert.match(runPracticeSource, /const measuredWidthPx = measureElement\.scrollWidth/);
  assert.match(runPracticeSource, /const shouldWrap = nextFontSizeRem <= PRACTICE_TITLE_FONT_SIZE_REM && measuredWidthPx > availableWidthPx/);
  assert.match(runPracticeSource, /fontSize: `\$\{drillTitleFit\.fontSizeRem\}rem`/);
  assert.match(runPracticeSource, /drillTitleFit\.shouldWrap \? "line-clamp-2 whitespace-normal" : "whitespace-nowrap"/);
  assert.doesNotMatch(runPracticeSource, /truncate whitespace-nowrap font-bold leading-\[1\.05\] tracking-normal transition-\[font-size\]/);
  assert.doesNotMatch(runPracticeSource, /const getAdaptiveDrillTitleFontSizeRem = \(name\?: string\) => \{[\s\S]*?characterCount[\s\S]*?return Math\.max\(PRACTICE_TITLE_FONT_SIZE_REM/);
  assert.match(runPracticeSource, /renderLiveDrillCard/);
  assert.match(runPracticeSource, /<button[\s\S]*?aria-label=\{detailsOpen \? "Collapse drill details" : "Expand drill details"\}[\s\S]*?<\/button>\s*<\/div>\s*<div className="mt-5 flex w-full/);
  assert.match(runPracticeSource, /w-full max-w-full touch-pan-x flex-nowrap overflow-x-auto overscroll-x-contain/);
  assert.match(runPracticeSource, /pr-5/);
  assert.match(runPracticeSource, /\[-ms-overflow-style:none\] \[scrollbar-width:none\] \[&::-webkit-scrollbar\]:hidden/);
  assert.match(runPracticeSource, /shrink-0 border-border bg-muted\/35 px-3 py-0 text-\[1\.05rem\]/);
  assert.match(runPracticeSource, /shrink-0 border-primary\/50 bg-primary\/10 px-3 py-0 text-\[1\.05rem\]/);
  assert.match(runPracticeSource, /return segment \|\| "Drill"/);
  assert.match(runPracticeSource, /\{drillFocusLabel\}/);
  assert.doesNotMatch(runPracticeSource, /Cond(?:itioning)?\./);
  assert.doesNotMatch(runPracticeSource, /currentDrillFocusLabel\.slice/);
  assert.doesNotMatch(runPracticeSource, /currentDrillFocusLabel\.substring/);
  assert.match(runPracticeSource, /<div className="mt-6">/);
  assert.match(runPracticeSource, /text-\[3\.825rem\]/);
  assert.match(runPracticeSource, /text-\[1\.35rem\]/);
  assert.doesNotMatch(runPracticeSource, /<div className="mt-9">/);
  assert.doesNotMatch(runPracticeSource, /text-\[4\.25rem\]/);
  assert.doesNotMatch(runPracticeSource, /text-\[1\.5rem\]/);
  assert.doesNotMatch(runPracticeSource, /break-words text-\[3\.25rem\]/);
  assert.doesNotMatch(runPracticeSource, /text-\[5\.25rem\]/);
  assert.doesNotMatch(runPracticeSource, /pb-3 text-\[2rem\]/);
});

test("RunPractice aligns the practice title and total minutes to the same text baseline", () => {
  assert.match(runPracticeSource, /relative mt-8 grid grid-cols-\[minmax\(0,1fr\)_auto\] items-baseline/);
  assert.match(runPracticeSource, /text-\[1\.55rem\] font-semibold leading-none text-muted-foreground/);
  assert.doesNotMatch(runPracticeSource, /grid min-h-\[5\.75rem\] grid-cols-\[minmax\(0,1fr\)_auto\] items-center/);
  assert.doesNotMatch(runPracticeSource, /self-end pb-1 text-\[1\.55rem\] font-semibold leading-none text-muted-foreground/);
});

test("RunPractice keeps the bottom elapsed total time fully visible on mobile", () => {
  assert.match(runPracticeSource, /space-y-3 pb-3 pt-5/);
  assert.match(runPracticeSource, /grid min-h-\[7rem\] grid-cols-\[auto_minmax\(0,1fr\)\] items-center gap-3/);
  assert.match(runPracticeSource, /inline-flex min-w-0 items-baseline gap-1\.5 whitespace-nowrap/);
  assert.match(runPracticeSource, /text-\[2\.3rem\] font-bold leading-none tabular-nums/);
  assert.match(runPracticeSource, /text-\[1\.25rem\] font-medium text-muted-foreground/);
  assert.match(runPracticeSource, /flex min-h-11 items-center justify-between gap-4/);
  assert.match(runPracticeSource, /flex min-w-0 flex-1 flex-wrap gap-2 text-xs font-medium/);
  assert.match(runPracticeSource, /flex shrink-0 justify-end gap-5/);
  assert.match(runPracticeSource, /h-10 rounded-full px-0 text-\[1\.15rem\] font-medium text-muted-foreground/);
  assert.match(runPracticeSource, /<RotateCcw className="h-5 w-5" \/>/);
  assert.match(runPracticeSource, /<Square className="h-5 w-5" \/>/);
  assert.doesNotMatch(runPracticeSource, /space-y-3 border-b border-border\/70 pb-3 pt-5/);
  assert.doesNotMatch(runPracticeSource, /space-y-4 border-b border-border\/70 py-7/);
  assert.doesNotMatch(runPracticeSource, /grid min-h-\[9rem\][\s\S]*?border-b border-border\/70 py-7/);
  assert.doesNotMatch(runPracticeSource, /mt-9 flex justify-end gap-8/);
  assert.doesNotMatch(runPracticeSource, /flex shrink-0 justify-end gap-8/);
  assert.doesNotMatch(runPracticeSource, /h-11 rounded-full px-0 text-\[1\.45rem\] font-medium text-muted-foreground/);
  assert.doesNotMatch(runPracticeSource, /className="h-8 w-8"/);
  assert.doesNotMatch(runPracticeSource, /truncate text-\[3\.25rem\] font-bold leading-none tabular-nums/);
  assert.doesNotMatch(runPracticeSource, /grid min-h-\[7rem\] grid-cols-\[auto_minmax\(0,1fr\)_auto\]/);
  assert.doesNotMatch(runPracticeSource, /translate-x-1 text-\[2\.35rem\] font-bold leading-none tabular-nums/);
});

test("RunPractice shows centisecond-style milliseconds in the bottom overall timer", () => {
  assert.match(runPracticeSource, /formatElapsedClock = \(totalMilliseconds: number\)/);
  assert.match(runPracticeSource, /const minutes = Math\.floor\(safeMilliseconds \/ 60000\)/);
  assert.match(runPracticeSource, /const seconds = Math\.floor\(\(safeMilliseconds % 60000\) \/ 1000\)/);
  assert.match(runPracticeSource, /const centiseconds = Math\.floor\(\(safeMilliseconds % 1000\) \/ 10\)/);
  assert.doesNotMatch(runPracticeSource, /const hours = Math\.floor\(totalMinutes \/ 60\)/);
  assert.match(runPracticeSource, /setElapsedPracticeMilliseconds/);
  assert.match(runPracticeSource, /performance\.now\(\)/);
  assert.match(runPracticeSource, /formatElapsedClock\(elapsedPracticeMilliseconds\)/);
});

test("RunPractice keeps drill and total timers on one synchronized clock", () => {
  assert.match(runPracticeSource, /const TIMER_SYNC_TOLERANCE_MS = 20/);
  assert.match(runPracticeSource, /const drillTimeRemainingMillisecondsRef = useRef\(0\)/);
  assert.match(runPracticeSource, /const currentDrillOvertimeMillisecondsRef = useRef\(0\)/);
  assert.match(runPracticeSource, /const elapsedDeltaMilliseconds = nextElapsed - elapsedPracticeMillisecondsRef\.current/);
  assert.match(runPracticeSource, /drillTimeRemainingMillisecondsRef\.current - elapsedDeltaMilliseconds/);
  assert.match(runPracticeSource, /window\.setInterval\(updateSynchronizedPracticeTimers, 10\)/);
  assert.doesNotMatch(runPracticeSource, /setInterval\(\(\) => \{[\s\S]*?setTotalTimeRemaining[\s\S]*?setDrillTimeRemaining[\s\S]*?\}, 1000\)/);
});

test("RunPractice live progress bar distributes elapsed practice time across drill segments", () => {
  assert.match(runPracticeSource, /import \{ getPracticeProgressSegments \} from "\.\/runPracticeProgress"/);
  assert.match(runPracticeSource, /const totalDurationMilliseconds = totalDurationSeconds \* 1000/);
  assert.match(runPracticeSource, /getPracticeProgressSegments\(\{/);
  assert.match(runPracticeSource, /elapsedPracticeMilliseconds,\s*totalDurationMilliseconds,\s*currentDrillIndex/);
  assert.match(runPracticeSource, /progressSegment\.fillPercent/);
  assert.match(runPracticeSource, /aria-current=\{progressSegment\.isActive \? "step" : undefined\}/);
  assert.match(runPracticeSource, /progressSegment\.isActive && "ring-2 ring-inset ring-primary\/80"/);
  assert.doesNotMatch(runPracticeSource, /let elapsedMillisecondsBeforeSegment = 0/);
  assert.doesNotMatch(runPracticeSource, /totalDurationSeconds - totalTimeRemaining/);
  assert.doesNotMatch(runPracticeSource, /segmentFillPercent = skippedDrillFills/);
  assert.doesNotMatch(runPracticeSource, /segmentFillPercent = skippedDrillFills\.get\(index\) \?\? 100/);
  assert.doesNotMatch(runPracticeSource, /drillDurationSeconds - drillTimeRemaining \+ currentDrillOvertime/);
  assert.doesNotMatch(runPracticeSource, /drillDurationMilliseconds -\s*drillTimeRemainingMillisecondsRef\.current \+\s*currentDrillOvertimeMillisecondsRef\.current/);
});

test("RunPractice reveals a clicked progress segment drill title below the bar", () => {
  assert.match(runPracticeSource, /selectedProgressSegmentIndex, setSelectedProgressSegmentIndex/);
  assert.match(runPracticeSource, /practiceProgressRef = useRef<HTMLDivElement \| null>\(null\)/);
  assert.match(runPracticeSource, /const selectedProgressSegment = selectedProgressSegmentIndex === null \? null : progressSegments\[selectedProgressSegmentIndex\]/);
  assert.match(runPracticeSource, /setSelectedProgressSegmentIndex\(\(currentIndex\) => \(currentIndex === index \? null : index\)\)/);
  assert.match(runPracticeSource, /document\.addEventListener\("pointerdown", handleOutsideProgressPointerDown\)/);
  assert.match(runPracticeSource, /practiceProgressRef\.current\.contains\(event\.target as Node\)/);
  assert.match(runPracticeSource, /document\.removeEventListener\("pointerdown", handleOutsideProgressPointerDown\)/);
  assert.match(runPracticeSource, /<button[\s\S]*?aria-label=\{`Show drill \$\{progressSegment\.name \|\| "Drill"\}`\}[\s\S]*?aria-pressed=\{selectedProgressSegmentIndex === index\}/);
  assert.match(runPracticeSource, /ref=\{practiceProgressRef\} className="relative"/);
  assert.match(runPracticeSource, /const selectedProgressSegmentLabelPositionPercent = selectedProgressSegment\s*\?\s*selectedProgressSegment\.startPercent \+ selectedProgressSegment\.widthPercent \/ 2\s*:\s*0/);
  assert.match(runPracticeSource, /const isFirstSelectedProgressSegment = selectedProgressSegmentIndex === 0/);
  assert.match(runPracticeSource, /const isLastSelectedProgressSegment = selectedProgressSegmentIndex === progressSegments\.length - 1/);
  assert.match(runPracticeSource, /isFirstSelectedProgressSegment \? "left-0" : isLastSelectedProgressSegment \? "right-0" : "-translate-x-1\/2"/);
  assert.match(runPracticeSource, /style=\{isFirstSelectedProgressSegment \|\| isLastSelectedProgressSegment\s*\?\s*undefined\s*:\s*\{ left: `\$\{selectedProgressSegmentLabelPositionPercent\}%` \}\}/);
  assert.match(runPracticeSource, /className=\{cn\(\s*"absolute top-full mt-2 flex max-w-\[min\(18rem,100%\)\] items-center gap-1\.5 whitespace-nowrap text-sm font-medium text-muted-foreground"/);
  assert.match(runPracticeSource, /selectedProgressSegment\?\.name && \(/);
  assert.match(runPracticeSource, /\{selectedProgressSegment\.name\}/);
  assert.match(runPracticeSource, /<span aria-hidden="true" className="shrink-0 text-muted-foreground\/70">•<\/span>/);
  assert.match(runPracticeSource, /\{selectedProgressSegment\.duration\} min/);
});

test("RunPractice slides whole drill cards with mirrored two-panel transitions", () => {
  assert.match(runPracticeSource, /type DrillSlideDirection = "next" \| "previous"/);
  assert.match(runPracticeSource, /type DrillSlideTransition = \{/);
  assert.match(runPracticeSource, /direction: DrillSlideDirection/);
  assert.match(runPracticeSource, /fromIndex: number/);
  assert.match(runPracticeSource, /toIndex: number/);
  assert.match(runPracticeSource, /startDrillSlideTransition/);
  assert.match(runPracticeSource, /renderLiveDrillCard/);
  assert.match(runPracticeSource, /const outgoingDrillCardClassName = cn\(/);
  assert.match(runPracticeSource, /const incomingDrillCardClassName = cn\(/);
  assert.match(runPracticeSource, /const activeDrillCardKey = `active-\$\{currentDrillIndex\}`/);
  assert.match(runPracticeSource, /key=\{`outgoing-\$\{drillSlideTransition\.fromIndex\}-\$\{drillSlideTransition\.toIndex\}-\$\{drillSlideTransition\.direction\}`\}/);
  assert.match(runPracticeSource, /key=\{activeDrillCardKey\}[\s\S]*?\{renderLiveDrillCard\(drillSlideTransition\.toIndex\)\}/);
  assert.match(runPracticeSource, /key=\{activeDrillCardKey\}[\s\S]*?\{renderLiveDrillCard\(currentDrillIndex\)\}/);
  assert.match(runPracticeSource, /drillSlideTransition\.direction === "next" && "-translate-x-full"/);
  assert.match(runPracticeSource, /drillSlideTransition\.direction === "previous" && "translate-x-full"/);
  assert.match(runPracticeSource, /drillSlideTransition\.direction === "next" && "translate-x-full"/);
  assert.match(runPracticeSource, /drillSlideTransition\.direction === "previous" && "-translate-x-full"/);
  assert.match(runPracticeSource, /motion-reduce:transition-none/);
  assert.doesNotMatch(runPracticeSource, /type SlideState = "idle" \| "next-exit" \| "next-enter" \| "previous-exit" \| "previous-enter"/);
  assert.doesNotMatch(runPracticeSource, /setSlideState\("next-exit"\)/);
  assert.doesNotMatch(runPracticeSource, /setSlideState\("previous-exit"\)/);
});

test("RunPractice keeps live run utility behavior while moving primary controls into the bottom bar", () => {
  assert.match(runPracticeSource, /handlePreviousDrill/);
  assert.match(runPracticeSource, /handleResetPractice/);
  assert.match(runPracticeSource, /handleEndTimer/);
  assert.match(runPracticeSource, /registerMobileBottomAction/);
  assert.match(runPracticeSource, /variant: "segmented"/);
  assert.match(runPracticeSource, /Previous/);
  assert.match(runPracticeSource, /Start/);
  assert.match(runPracticeSource, /Next/);
});

test("RunPractice shows an inline finished-drill action beside the remaining timer", () => {
  assert.match(runPracticeSource, /const isCurrentDrillFinished = Boolean\(currentDrill\) && drillTimeRemaining === 0/);
  assert.match(runPracticeSource, /const hasNextDrill = currentDrillIndex < drillSequence\.length - 1/);
  assert.match(runPracticeSource, /const finishedDrillActionLabel = hasNextDrill \? "Next drill" : "Finish practice"/);
  assert.match(runPracticeSource, /isCurrentDrillFinished && !showFeedback/);
  assert.match(runPracticeSource, /hasNextDrill \? handleNextDrill\(\) : handleEndTimer\(\)/);
  assert.match(runPracticeSource, /disabled=\{isAnimating \|\| drillSequence\.length === 0\}/);
  assert.match(runPracticeSource, /finishedDrillActionLabel/);
});

test("RunPractice uses one net pace banner for ahead and behind updates", () => {
  assert.match(runPracticeSource, /type PaceNotification = \{/);
  assert.match(runPracticeSource, /kind: "ahead" \| "behind"/);
  assert.match(runPracticeSource, /eventSeconds: number/);
  assert.match(runPracticeSource, /netSeconds: number/);
  assert.match(runPracticeSource, /id: number/);
  assert.match(runPracticeSource, /paceNotificationTimeoutRef = useRef<number \| null>\(null\)/);
  assert.match(runPracticeSource, /paceNotificationDismissTimeoutRef = useRef<number \| null>\(null\)/);
  assert.match(runPracticeSource, /clearPaceNotificationTimeout/);
  assert.match(runPracticeSource, /window\.clearTimeout\(paceNotificationTimeoutRef\.current\)/);
  assert.match(runPracticeSource, /showPaceNotification/);
  assert.match(runPracticeSource, /setPaceNotification\(null\)/);
  assert.match(runPracticeSource, /setIsPaceNotificationVisible\(false\)/);
  assert.match(runPracticeSource, /const nextNetSeconds = nextTimeSaved - nextTimeBehind/);
  assert.match(runPracticeSource, /Math\.abs\(nextNetSeconds\)/);
  assert.match(runPracticeSource, /paceNotification && \(/);
  assert.match(runPracticeSource, /paceNotification\.kind === "ahead"/);
  assert.match(runPracticeSource, /paceNotification\.netSeconds/);
  assert.match(
    runPracticeSource,
    /isPaceNotificationVisible[\s\S]*?opacity-100 translate-y-0[\s\S]*?opacity-0 -translate-y-4 pointer-events-none/
  );
  assert.match(runPracticeSource, /PACE_NOTIFICATION_EXIT_DURATION_MS = 500/);
  assert.doesNotMatch(runPracticeSource, /showTimeSavedToast/);
  assert.doesNotMatch(runPracticeSource, /showTimeBehindToast/);
  assert.equal(
    runPracticeSource.match(/fixed top-4 left-1\/2 -translate-x-1\/2 z-50 transition-all duration-500 ease-out/g)?.length,
    1
  );
});

test("RunPractice reverses pace totals when moving back to the previous drill", () => {
  assert.match(runPracticeSource, /type PaceAdjustment = \{/);
  assert.match(runPracticeSource, /savedSeconds: number/);
  assert.match(runPracticeSource, /behindSeconds: number/);
  assert.match(runPracticeSource, /paceAdjustmentsByDrillIndex/);
  assert.match(runPracticeSource, /\[currentDrillIndex\]: \{/);
  assert.match(runPracticeSource, /const adjustmentToReverse = paceAdjustmentsByDrillIndex\[previousIndex\]/);
  assert.match(runPracticeSource, /Math\.max\(0, timeSaved - adjustmentToReverse\.savedSeconds\)/);
  assert.match(runPracticeSource, /Math\.max\(0, timeBehind - adjustmentToReverse\.behindSeconds\)/);
  assert.match(runPracticeSource, /delete nextAdjustments\[previousIndex\]/);
});
