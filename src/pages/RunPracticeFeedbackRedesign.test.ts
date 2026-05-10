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
  assert.match(runPracticeSource, /bg-primary text-primary-foreground hover:bg-primary\/90/);
  assert.match(runPracticeSource, /-mx-4/);
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

test("RunPractice prevents closed-state page scrolling while keeping dropdown content scrollable", () => {
  assert.match(runPracticeSource, /const isLiveContentScrollable = isDrillDetailsOpen \|\| isNextPreviewOpen/);
  assert.match(runPracticeSource, /h-\[calc\(100dvh-var\(--app-safe-area-top\)-4\.75rem-var\(--app-safe-area-bottom\)\)\]/);
  assert.match(runPracticeSource, /isLiveContentScrollable \? "overflow-y-auto pb-2" : "overflow-hidden pb-0"/);
  assert.doesNotMatch(runPracticeSource, /<div className="mx-auto max-w-md pb-2 text-foreground">/);
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
  assert.match(runPracticeSource, /<button[\s\S]*?aria-label=\{isDrillDetailsOpen \? "Collapse drill details" : "Expand drill details"\}[\s\S]*?<\/button>\s*<\/div>\s*<div className="mt-5 flex w-full/);
  assert.match(runPracticeSource, /w-full max-w-full touch-pan-x flex-nowrap overflow-x-auto overscroll-x-contain/);
  assert.match(runPracticeSource, /pr-5/);
  assert.match(runPracticeSource, /\[-ms-overflow-style:none\] \[scrollbar-width:none\] \[&::-webkit-scrollbar\]:hidden/);
  assert.match(runPracticeSource, /shrink-0 border-border bg-muted\/35 px-3 py-0 text-\[1\.05rem\]/);
  assert.match(runPracticeSource, /shrink-0 border-primary\/50 bg-primary\/10 px-3 py-0 text-\[1\.05rem\]/);
  assert.match(runPracticeSource, /return segment \|\| "Drill"/);
  assert.match(runPracticeSource, /\{currentDrillFocusLabel\}/);
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
  assert.match(runPracticeSource, /grid min-h-\[5\.75rem\] grid-cols-\[minmax\(0,1fr\)_auto\] items-baseline/);
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
  assert.match(runPracticeSource, /const totalDurationMilliseconds = totalDurationSeconds \* 1000/);
  assert.match(runPracticeSource, /elapsedPracticeMilliseconds \/ totalDurationMilliseconds/);
  assert.match(runPracticeSource, /let elapsedMillisecondsBeforeSegment = 0/);
  assert.match(runPracticeSource, /const elapsedMillisecondsAtSegmentStart = elapsedMillisecondsBeforeSegment/);
  assert.match(runPracticeSource, /const elapsedMillisecondsInSegment = Math\.max\(\s*0,\s*Math\.min\(\s*elapsedPracticeMilliseconds - elapsedMillisecondsAtSegmentStart,\s*drillDurationMilliseconds\s*\)\s*\)/);
  assert.match(runPracticeSource, /elapsedMillisecondsInSegment \/ drillDurationMilliseconds/);
  assert.doesNotMatch(runPracticeSource, /totalDurationSeconds - totalTimeRemaining/);
  assert.doesNotMatch(runPracticeSource, /segmentFillPercent = skippedDrillFills/);
  assert.doesNotMatch(runPracticeSource, /segmentFillPercent = skippedDrillFills\.get\(index\) \?\? 100/);
  assert.doesNotMatch(runPracticeSource, /drillDurationSeconds - drillTimeRemaining \+ currentDrillOvertime/);
  assert.doesNotMatch(runPracticeSource, /drillDurationMilliseconds -\s*drillTimeRemainingMillisecondsRef\.current \+\s*currentDrillOvertimeMillisecondsRef\.current/);
});

test("RunPractice uses explicit mirrored slide directions for next and previous drills", () => {
  assert.match(runPracticeSource, /type SlideState = "idle" \| "next-exit" \| "next-enter" \| "previous-exit" \| "previous-enter"/);
  assert.match(runPracticeSource, /setSlideState\("next-exit"\)/);
  assert.match(runPracticeSource, /setSlideState\("next-enter"\)/);
  assert.match(runPracticeSource, /setSlideState\("previous-exit"\)/);
  assert.match(runPracticeSource, /setSlideState\("previous-enter"\)/);
  assert.match(runPracticeSource, /slideState === "next-exit" && "-translate-x-full opacity-0"/);
  assert.match(runPracticeSource, /slideState === "next-enter" && "translate-x-full opacity-0"/);
  assert.match(runPracticeSource, /slideState === "previous-exit" && "translate-x-full opacity-0"/);
  assert.match(runPracticeSource, /slideState === "previous-enter" && "-translate-x-full opacity-0"/);
  assert.doesNotMatch(runPracticeSource, /type SlideState = "idle" \| "sliding-out" \| "sliding-in"/);
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
  assert.match(runPracticeSource, /clearPaceNotificationTimeout/);
  assert.match(runPracticeSource, /window\.clearTimeout\(paceNotificationTimeoutRef\.current\)/);
  assert.match(runPracticeSource, /showPaceNotification/);
  assert.match(runPracticeSource, /setPaceNotification\(null\)/);
  assert.match(runPracticeSource, /const nextNetSeconds = nextTimeSaved - nextTimeBehind/);
  assert.match(runPracticeSource, /Math\.abs\(nextNetSeconds\)/);
  assert.match(runPracticeSource, /paceNotification\?\.kind === "ahead"/);
  assert.match(runPracticeSource, /paceNotification\.netSeconds/);
  assert.doesNotMatch(runPracticeSource, /showTimeSavedToast/);
  assert.doesNotMatch(runPracticeSource, /showTimeBehindToast/);
  assert.equal(
    runPracticeSource.match(/fixed top-4 left-1\/2 -translate-x-1\/2 z-50 transition-all duration-500 ease-out/g)?.length,
    1
  );
});
