import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  assertWorkspace,
  formatWorkspaceCheckFailure,
  resolveConfiguredWorkspace,
} from "./ensure-workspace.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

test("resolveConfiguredWorkspace defaults to the repo root derived from the script location", () => {
  const originalWorkspace = process.env.COACHVISION_WORKSPACE;
  delete process.env.COACHVISION_WORKSPACE;

  try {
    assert.equal(resolveConfiguredWorkspace(), repoRoot);
  } finally {
    if (originalWorkspace === undefined) {
      delete process.env.COACHVISION_WORKSPACE;
    } else {
      process.env.COACHVISION_WORKSPACE = originalWorkspace;
    }
  }
});

test("resolveConfiguredWorkspace uses the override env var when provided", () => {
  const originalWorkspace = process.env.COACHVISION_WORKSPACE;
  process.env.COACHVISION_WORKSPACE = "/tmp/coachvision-override";

  try {
    assert.equal(resolveConfiguredWorkspace(), "/tmp/coachvision-override");
  } finally {
    if (originalWorkspace === undefined) {
      delete process.env.COACHVISION_WORKSPACE;
    } else {
      process.env.COACHVISION_WORKSPACE = originalWorkspace;
    }
  }
});

test("formatWorkspaceCheckFailure includes the resolved expected workspace in the guidance", () => {
  const failureMessage = formatWorkspaceCheckFailure("/tmp/current", "/tmp/expected");

  assert.match(failureMessage, /Workspace check failed\./);
  assert.match(failureMessage, /Current:  \/tmp\/current/);
  assert.match(failureMessage, /Expected: \/tmp\/expected/);
  assert.match(failureMessage, /Run: cd \/tmp\/expected/);
});

test("assertWorkspace reports mismatches using the computed expected path", async () => {
  const errors = [];
  let exitCode = null;

  await assertWorkspace({
    cwd: "/tmp",
    expectedWorkspace: repoRoot,
    stderr: (message) => errors.push(message),
    exit: (code) => {
      exitCode = code;
    },
  });

  assert.equal(exitCode, 1);
  assert.equal(errors.length, 1);
  assert.match(errors[0], new RegExp(`Expected: ${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
  assert.match(errors[0], new RegExp(`Run: cd ${repoRoot.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
});
