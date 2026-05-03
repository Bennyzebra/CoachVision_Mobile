import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  getExpectedIntensityForPreference,
  normalizeIntensityPreference,
} from "./intensityPreference.ts";

test("normalizes legacy high intensity to intense", () => {
  assert.equal(normalizeIntensityPreference("high"), "intense");
});

test("keeps balanced on the current phase-based intensity progression", () => {
  assert.equal(getExpectedIntensityForPreference("balanced", 35), 2.5);
  assert.equal(getExpectedIntensityForPreference("balanced", 18), 3);
  assert.equal(getExpectedIntensityForPreference("balanced", 10), 4);
});

test("recovery and intense shift intensity targets without hard filtering", () => {
  assert.equal(getExpectedIntensityForPreference("recovery", 10), 1.5);
  assert.equal(getExpectedIntensityForPreference("light", 10), 2.5);
  assert.equal(getExpectedIntensityForPreference("intense", 35), 4.5);
});
