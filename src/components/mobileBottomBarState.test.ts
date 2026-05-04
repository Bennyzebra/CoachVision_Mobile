import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(new URL("./mobileBottomBarState.ts", import.meta.url), "utf8");

test("maps the mobile lower bar routes to the expected labels", () => {
  assert.match(source, /pathname === "\/"/);
  assert.match(source, /label: "Generate Practice Plan"/);
  assert.match(source, /pathname\.startsWith\("\/practice-tracker"\)/);
  assert.match(source, /label: "Practice History"/);
  assert.match(source, /pathname\.startsWith\("\/settings"\)/);
  assert.match(source, /label: "Settings"/);
  assert.match(source, /pathname\.startsWith\("\/team"\)/);
  assert.match(source, /label: "Team & Roster"/);
});

test("keeps the mobile lower bar width stable across route states", () => {
  assert.match(source, /const MOBILE_BOTTOM_BAR_WIDTH_CLASS = "w-\[19rem\] max-w-\[calc\(100vw-2rem\)\]"/);
  assert.match(source, /widthClass: MOBILE_BOTTOM_BAR_WIDTH_CLASS/);
});
