import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const drillLibrarySource = readFileSync(new URL("./DrillLibrary.tsx", import.meta.url), "utf8");

test("DrillLibrary filter chip row hides the native horizontal scrollbar", () => {
  assert.match(
    drillLibrarySource,
    /className="[^"]*\btouch-scroll\b[^"]*\boverflow-x-auto\b[^"]*\bscrollbar-none\b[^"]*"/,
  );
});
