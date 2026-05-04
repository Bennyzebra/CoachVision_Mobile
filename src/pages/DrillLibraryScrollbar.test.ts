import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const drillLibrarySource = readFileSync(new URL("./DrillLibrary.tsx", import.meta.url), "utf8");

test("DrillLibrary filter chips keep horizontal scroll while hiding native scrollbar", () => {
  assert.match(drillLibrarySource, /overflow-x-auto/);
  assert.match(drillLibrarySource, /scrollbar-none/);
});
