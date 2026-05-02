import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createGeneratedPlanFromFallback } from "./autoPlanFallback.ts";
import type { Drill } from "@/types";

const drills: Drill[] = [
  {
    id: "warmup-1",
    name: "Dynamic Warmup",
    focus: "conditioning",
    duration: 10,
    rating: 0,
    verified: true,
    description: "",
    cues: [],
    tags: ["warmup"],
  },
  {
    id: "main-1",
    name: "Shell Defense",
    focus: "defense",
    duration: 20,
    rating: 0,
    verified: true,
    description: "",
    cues: [],
    tags: ["defense"],
  },
  {
    id: "cooldown-1",
    name: "Free Throws",
    focus: "shooting",
    duration: 5,
    rating: 0,
    verified: true,
    description: "",
    cues: [],
    tags: ["cooldown"],
  },
];

test("creates a generated plan from local fallback items without Gemini explanations", () => {
  const result = createGeneratedPlanFromFallback(
    [
      {
        drillId: "warmup-1",
        segment: "warmup",
        duration: 8,
        explainWhy: "Gets players loose before contact work.",
      },
      {
        drillId: "main-1",
        segment: "main",
        duration: 24,
        explainWhy: "Builds defensive communication.",
      },
      {
        drillId: "cooldown-1",
        segment: "cooldown",
        duration: 6,
        explainWhy: "Settles the group with focused shooting.",
      },
    ],
    drills
  );

  assert.equal(result?.coach_notes, "Generated locally based on your practice defaults.");
  assert.equal(result?.warmup[0].duration, 8);
  assert.equal(result?.warmup[0].explainWhy, "Gets players loose before contact work.");
  assert.equal(result?.main_segment[0].name, "Shell Defense");
  assert.equal(result?.cool_down[0].explainWhy, "Settles the group with focused shooting.");
});

test("returns null when local fallback items do not match available drills", () => {
  assert.equal(
    createGeneratedPlanFromFallback(
      [{ drillId: "missing", segment: "main", duration: 10, explainWhy: "Missing drill." }],
      drills
    ),
    null
  );
});
