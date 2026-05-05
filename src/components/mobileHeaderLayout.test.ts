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
