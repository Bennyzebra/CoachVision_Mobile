import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");
const configurationSource = autoPlanSource.slice(
  autoPlanSource.indexOf("Practice Configuration"),
  autoPlanSource.indexOf("Choose Focus Areas"),
);
const intensitySelectorSource = configurationSource.slice(
  configurationSource.indexOf("Practice Intensity"),
  configurationSource.indexOf("Practice Length"),
);

test("AutoPlan renders the intensity selector before practice length", () => {
  const intensityIndex = configurationSource.indexOf("Practice Intensity");
  const practiceLengthIndex = configurationSource.indexOf("Practice Length");

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
  assert.match(
    autoPlanSource,
    /className="[^"]*\boverflow-x-auto\b[^"]*\bscrollbar-none\b[^"]*"/,
  );
  assert.match(intensitySelectorSource, /\bmin-w-max\b/);
  assert.match(intensitySelectorSource, /\btext-white\b/);
  assert.match(intensitySelectorSource, /\bw-fit\b/);
  assert.match(intensitySelectorSource, /\bshrink-0\b/);
  assert.doesNotMatch(intensitySelectorSource, /min-w-\[7\.25rem\]/);
  assert.doesNotMatch(intensitySelectorSource, /\bflex-1\b/);
  assert.match(autoPlanSource, /border-2/);
  assert.match(intensitySelectorSource, /border-primary-foreground/);
});
