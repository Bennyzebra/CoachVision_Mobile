import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const onboardingSource = readFileSync(new URL("./Onboarding.tsx", import.meta.url), "utf8");
const appCssSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");
const layoutSource = readFileSync(new URL("../components/Layout.tsx", import.meta.url), "utf8");

test("create-team onboarding stays frontend-only", () => {
  assert.doesNotMatch(onboardingSource, /from\("teams"\)|supabase|\.insert\(/);
  assert.match(onboardingSource, /createInitialTeamDraft/);
  assert.match(onboardingSource, /Create Team is intentionally disabled/);
});

test("create-team onboarding registers Back and Continue controls in the mobile island", () => {
  assert.match(onboardingSource, /registerMobileBottomAction/);
  assert.match(onboardingSource, /variant: "segmented"/);
  assert.match(onboardingSource, /label: "Back"/);
  assert.match(onboardingSource, /const nextLabel = step === 3 \? "Review"/);
});

test("player number badges edit in place without opening the player card", () => {
  assert.match(onboardingSource, /const editJerseyNumber = \(\) =>/);
  assert.match(onboardingSource, /setIsEditingJerseyNumber\(true\)/);
  assert.match(onboardingSource, /jerseyNumberInputRef\.current\?\.focus/);
  assert.match(onboardingSource, /onClick=\{editJerseyNumber\}/);
  assert.doesNotMatch(onboardingSource, /const focusJerseyNumber/);
  assert.match(onboardingSource, /player\.jerseyNumber \? Number\(player\.jerseyNumber\) : index \+ 1/);
  assert.match(onboardingSource, /pattern="\[0-9\]\*"/);
  assert.match(onboardingSource, /max-w-9 shrink-0[^"\n]*text-base/);
});

test("player cards smoothly expand and collapse", () => {
  assert.match(onboardingSource, /player-card-collapsible/);
  assert.match(appCssSource, /@keyframes player-card-expand/);
  assert.match(appCssSource, /--radix-collapsible-content-height/);
  assert.match(appCssSource, /prefers-reduced-motion: reduce/);
});

test("player height is required and individual experience is not collected", () => {
  assert.match(onboardingSource, /Name, position, and height are required/);
  assert.match(onboardingSource, /<Label>Height <span className="text-destructive">\*<\/span><\/Label>/);
  assert.doesNotMatch(onboardingSource, /player\.experience|PlayerDraft\["experience"\]|>Experience /);
  assert.doesNotMatch(onboardingSource, /player\.age|\{`${player\.id}-age`\}|>Age<\/Label>/);
});

test("practice priorities and coaching notes are required and can be written in", () => {
  assert.match(onboardingSource, /Practice priorities <span className="text-destructive">\*/);
  assert.match(onboardingSource, /Write in another priority/);
  assert.match(onboardingSource, /addCustomPriority\(\)/);
  assert.match(onboardingSource, /Coaching notes <span className="text-destructive">\*/);
  assert.doesNotMatch(onboardingSource, /maxLength=\{500\}|\/500|Season priorities|Typical practice duration/);
  assert.match(onboardingSource, /Default practice duration/);
});

test("empty roster shows one add action and cards close only on explicit input", () => {
  assert.match(onboardingSource, /draft\.players\.length === 0 \? \([\s\S]*?Add player/);
  assert.doesNotMatch(onboardingSource, /players in this draft/);
  assert.match(onboardingSource, /const isOpen = expanded/);
  assert.match(onboardingSource, /onExpandedChange\(false\)/);
  assert.match(onboardingSource, /setExpandedPlayers\(\(current\) => \{[\s\S]*?Object\.keys\(errors\)/);
});

test("mobile header stays visible throughout first-team setup", () => {
  assert.match(layoutSource, /if \(isFirstTeamSetup\) setMobileHeaderOffset\(0, false\)/);
  assert.match(layoutSource, /if \(isFirstTeamSetup\) \{\s*lastScrollYRef\.current = currentY;\s*return;/);
  assert.match(layoutSource, /isFirstTeamSetup \? 0 : mobileHeaderOffsetPx/);
});

test("create-team onboarding uses one page header and moves progress into the mobile island", () => {
  assert.match(onboardingSource, /const stepTitles = \[[\s\S]*"Create your first team"[\s\S]*"Practice environment"/);
  assert.match(onboardingSource, /\{stepTitles\[step\]\}/);
  assert.match(onboardingSource, /Step \{step \+ 1\} of \{CREATE_TEAM_STEP_COUNT\}/);
  assert.doesNotMatch(onboardingSource, /steps\[step\]\.description|ActiveIcon/);
  assert.doesNotMatch(onboardingSource, /<Progress/);
  assert.match(onboardingSource, /progress: \{/);
});

test("first-team setup limits the account menu to email and log out", () => {
  assert.match(layoutSource, /const isFirstTeamSetup = location\.pathname === "\/onboarding"/);
  assert.match(layoutSource, /!isFirstTeamSetup && \([\s\S]*?coachDisplayName/);
  assert.match(
    layoutSource,
    /!isFirstTeamSetup && \([\s\S]*?Theme[\s\S]*?Team & Roster[\s\S]*?Settings[\s\S]*?Practice History[\s\S]*?Submit Drill/
  );
  assert.match(layoutSource, /\{userEmail\}[\s\S]*?Log Out/);
});
