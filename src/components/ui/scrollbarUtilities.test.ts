import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cssSource = readFileSync(new URL("../../index.css", import.meta.url), "utf8");

test("scrollbar-none utility hides native scrollbars across supported engines", () => {
  assert.match(cssSource, /\.scrollbar-none\s*\{[\s\S]*scrollbar-width:\s*none/);
  assert.match(cssSource, /\.scrollbar-none\s*\{[\s\S]*-ms-overflow-style:\s*none/);
  assert.match(cssSource, /\.scrollbar-none::-webkit-scrollbar\s*\{[\s\S]*display:\s*none/);
});
