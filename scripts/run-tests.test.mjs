import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { findTestFiles } from "./run-tests.mjs";
import { assertLocalFiles } from "./check-local-files.mjs";

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), "coachvision-test-discovery-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  return root;
}

test("discovers nested tests and ignores implementation files", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, "nested"));
  const files = ["unit.test.ts", "runner.test.mjs", "plain.test.js", "legacy.test.cjs", "nested/deep.test.ts"];
  for (const file of [...files, "implementation.ts"]) await writeFile(join(root, file), "");
  assert.deepEqual((await findTestFiles(root)).sort(), files.map((file) => join(root, file)).sort());
});

for (const name of ["regression.test 2.ts", "component.test.tsx", "regression.spec.ts"]) {
  test(`rejects ${name} instead of silently skipping it`, async (t) => {
    const root = await fixture(t);
    await writeFile(join(root, name), "");
    await assert.rejects(findTestFiles(root), /Unsupported test filename/);
  });
}

test("reports missing dependencies before starting tools", async (t) => {
  const root = await fixture(t);
  assert.throws(() => assertLocalFiles(root), /Run npm ci/);
});

test("accepts local dependency files", async (t) => {
  const root = await fixture(t);
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "node_modules", "local.js"), "export default 1;");
  assert.doesNotThrow(() => assertLocalFiles(root));
});
