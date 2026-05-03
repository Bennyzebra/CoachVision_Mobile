import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");

test("AutoPlan renders the intensity selector before practice length", () => {
  const intensityIndex = autoPlanSource.indexOf("Practice Intensity");
  const practiceLengthIndex = autoPlanSource.indexOf("Practice Length");

  assert.ok(intensityIndex > -1, "AutoPlan should render the practice intensity selector");
  assert.ok(practiceLengthIndex > -1, "AutoPlan should render practice length");
  assert.ok(intensityIndex < practiceLengthIndex, "Practice intensity should appear above practice length");
});

test("AutoPlan passes the selected session intensity through generation", () => {
  assert.match(autoPlanSource, /intensityPreference:\s*practiceDefaults\.intensityPreference/);
  assert.match(autoPlanSource, /coachRequirements\s*=\s*\{[\s\S]*intensityPreference/s);
  assert.match(autoPlanSource, /buildTeamProfile\(\{[\s\S]*intensityPreference:\s*practiceDefaults\.intensityPreference/s);
});

test("AutoPlan intensity selector uses horizontal scrollable bubbles", () => {
  assert.match(autoPlanSource, /intensityOptions\.map/);
  assert.match(autoPlanSource, /overflow-x-auto/);
  assert.match(autoPlanSource, /scrollbar-none/);
  assert.match(autoPlanSource, /border-2/);
});
