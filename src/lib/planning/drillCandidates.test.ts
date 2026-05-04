import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  selectPracticePlanCandidateDrills,
  PRACTICE_PLAN_DRILL_CANDIDATE_LIMIT,
  type PracticePlanCandidateDrill,
} from "./drillCandidates.ts";

const makeDrill = (
  id: string,
  overrides: Partial<PracticePlanCandidateDrill> = {},
): PracticePlanCandidateDrill => ({
  id,
  name: `Drill ${id}`,
  focus: "offense",
  duration: 10,
  rating: 3,
  verified: true,
  description: "",
  tags: [],
  ...overrides,
});

test("selectPracticePlanCandidateDrills caps and ranks focus-compatible drills first", () => {
  const drills = [
    ...Array.from({ length: 90 }, (_, index) =>
      makeDrill(`defense-${index}`, { focus: "defense", tags: ["closeout"] }),
    ),
    ...Array.from({ length: 20 }, (_, index) =>
      makeDrill(`shooting-${index}`, {
        focus: "offense",
        category: "shooting",
        tags: ["shooting", "form"],
      }),
    ),
  ];

  const candidates = selectPracticePlanCandidateDrills(drills, {
    focus: "shooting",
    duration: 60,
    ageGroup: "intermediate",
  });

  assert.equal(candidates.length, PRACTICE_PLAN_DRILL_CANDIDATE_LIMIT);
  assert.ok(candidates.slice(0, 20).every((drill) => drill.id.startsWith("shooting-")));
});

test("selectPracticePlanCandidateDrills deprioritizes recent drills without dropping them when needed", () => {
  const drills = [
    makeDrill("recent-shooting", { category: "shooting", tags: ["shooting"] }),
    makeDrill("fresh-shooting", { category: "shooting", tags: ["shooting"] }),
    makeDrill("fresh-defense", { focus: "defense" }),
  ];

  const candidates = selectPracticePlanCandidateDrills(drills, {
    focus: "shooting",
    duration: 30,
    ageGroup: "intermediate",
    recentDrillIds: ["recent-shooting"],
    limit: 3,
  });

  assert.equal(candidates.length, 3);
  assert.equal(candidates[0].id, "fresh-shooting");
  assert.ok(candidates.some((drill) => drill.id === "recent-shooting"));
});

test("selectPracticePlanCandidateDrills filters out drills that cannot fit the session duration", () => {
  const candidates = selectPracticePlanCandidateDrills(
    [
      makeDrill("fits", { duration: 12 }),
      makeDrill("too-long", { duration: 45 }),
    ],
    {
      focus: "offense",
      duration: 30,
      ageGroup: "beginner",
    },
  );

  assert.deepEqual(
    candidates.map((drill) => drill.id),
    ["fits"],
  );
});
