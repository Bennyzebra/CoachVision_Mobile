import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const autoPlanSource = readFileSync(new URL("./AutoPlan.tsx", import.meta.url), "utf8");

test("AutoPlan generated plan actions show create and export icon buttons", () => {
  assert.match(autoPlanSource, /PlusCircle/);
  assert.match(autoPlanSource, /Download/);
  assert.match(autoPlanSource, /Create New Plan/);
  assert.match(autoPlanSource, /Export/);
});
