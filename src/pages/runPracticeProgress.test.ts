import { strict as assert } from "node:assert";
import { test } from "node:test";

import { getPracticeProgressSegments } from "./runPracticeProgress.ts";

const drills = [
  { name: "Warmup", duration: 10, segment: "Warmup" },
  { name: "Shooting", duration: 20, segment: "Main Segment" },
  { name: "Cooldown", duration: 10, segment: "Cool Down" },
];

test("returns empty segment fills at zero elapsed time", () => {
  const segments = getPracticeProgressSegments({
    drillSequence: drills,
    elapsedPracticeMilliseconds: 0,
    totalDurationMilliseconds: 40 * 60 * 1000,
    currentDrillIndex: 0,
  });

  assert.deepEqual(
    segments.map((segment) => segment.fillPercent),
    [0, 0, 0]
  );
  assert.deepEqual(
    segments.map((segment) => segment.widthPercent),
    [25, 50, 25]
  );
  assert.deepEqual(
    segments.map((segment) => segment.startPercent),
    [0, 25, 75]
  );
  assert.equal(segments[0].isActive, true);
});

test("fills only the first segment halfway through the first drill", () => {
  const segments = getPracticeProgressSegments({
    drillSequence: drills,
    elapsedPracticeMilliseconds: 5 * 60 * 1000,
    totalDurationMilliseconds: 40 * 60 * 1000,
    currentDrillIndex: 0,
  });

  assert.deepEqual(
    segments.map((segment) => segment.fillPercent),
    [50, 0, 0]
  );
});

test("fills completed segments and partially fills the active elapsed segment", () => {
  const segments = getPracticeProgressSegments({
    drillSequence: drills,
    elapsedPracticeMilliseconds: 15 * 60 * 1000,
    totalDurationMilliseconds: 40 * 60 * 1000,
    currentDrillIndex: 1,
  });

  assert.deepEqual(
    segments.map((segment) => segment.fillPercent),
    [100, 25, 0]
  );
  assert.equal(segments[1].isActive, true);
});

test("changing current drill changes active state without changing elapsed fills", () => {
  const firstView = getPracticeProgressSegments({
    drillSequence: drills,
    elapsedPracticeMilliseconds: 5 * 60 * 1000,
    totalDurationMilliseconds: 40 * 60 * 1000,
    currentDrillIndex: 0,
  });
  const skippedView = getPracticeProgressSegments({
    drillSequence: drills,
    elapsedPracticeMilliseconds: 5 * 60 * 1000,
    totalDurationMilliseconds: 40 * 60 * 1000,
    currentDrillIndex: 2,
  });

  assert.deepEqual(
    skippedView.map((segment) => segment.fillPercent),
    firstView.map((segment) => segment.fillPercent)
  );
  assert.deepEqual(
    skippedView.map((segment) => segment.isActive),
    [false, false, true]
  );
});

test("zero and missing durations produce finite non-negative percentages", () => {
  const segments = getPracticeProgressSegments({
    drillSequence: [
      { name: "No duration", segment: "Warmup" },
      { name: "Zero duration", duration: 0, segment: "Main Segment" },
      { name: "Timed", duration: 5, segment: "Cool Down" },
    ],
    elapsedPracticeMilliseconds: 30 * 1000,
    totalDurationMilliseconds: 5 * 60 * 1000,
    currentDrillIndex: 0,
  });

  for (const segment of segments) {
    assert.equal(Number.isFinite(segment.widthPercent), true);
    assert.equal(Number.isFinite(segment.startPercent), true);
    assert.equal(Number.isFinite(segment.fillPercent), true);
    assert.equal(segment.widthPercent >= 0, true);
    assert.equal(segment.startPercent >= 0, true);
    assert.equal(segment.fillPercent >= 0, true);
  }
  assert.deepEqual(
    segments.map((segment) => segment.widthPercent),
    [0, 0, 100]
  );
});
