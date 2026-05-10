import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const layoutSource = readFileSync(new URL("./Layout.tsx", import.meta.url), "utf8");
const indexCssSource = readFileSync(new URL("../index.css", import.meta.url), "utf8");

test("mobile content starts just below the header with title-subtitle rhythm", () => {
  assert.match(
    indexCssSource,
    /--mobile-content-top-offset:\s*calc\(var\(--mobile-header-height\) \+ 1\.25rem\);/
  );
  assert.match(layoutSource, /pt-\[var\(--mobile-content-top-offset\)\]/);
});

test("run practice hides the mobile team header and uses the bottom divider as the cutoff", () => {
  assert.match(layoutSource, /isRunPracticeRoute/);
  assert.match(layoutSource, /!isRunPracticeRoute && \(/);
  assert.match(layoutSource, /isRunPracticeRoute && "pt-\[calc\(var\(--app-safe-area-top\)\+0\.75rem\)\] pb-\[calc\(4rem\+var\(--app-safe-area-bottom\)\)\] sm:px-4"/);
  assert.doesNotMatch(layoutSource, /isRunPracticeRoute && "pt-\[calc\(var\(--mobile-header-height\)\+0\.5rem\)\] sm:px-4"/);
  assert.doesNotMatch(layoutSource, /mobile-header-height\)\+0\.5rem/);
  assert.doesNotMatch(layoutSource, /mobile-content-top-offset\)\+2\.75rem/);
});
