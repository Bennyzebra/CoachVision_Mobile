import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("CommandDialog opts out of a visible description warning intentionally", () => {
  const source = readFileSync(new URL("./command.tsx", import.meta.url), "utf8");

  assert.match(
    source,
    /<DialogContent[^>]*aria-describedby=\{undefined\}/,
    "CommandDialog DialogContent should intentionally omit aria-describedby when it has no visible description"
  );
});
