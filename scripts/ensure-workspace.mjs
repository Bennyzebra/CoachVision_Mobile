import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const defaultWorkspace = path.resolve(scriptDir, "..");

export function resolveConfiguredWorkspace() {
  return process.env.COACHVISION_WORKSPACE || defaultWorkspace;
}

export function formatWorkspaceCheckFailure(currentPath, expectedPath) {
  return [
    "Workspace check failed.",
    `Current:  ${currentPath}`,
    `Expected: ${expectedPath}`,
    `Run: cd ${expectedPath}`,
  ].join("\n");
}

export async function assertWorkspace({
  cwd = process.cwd(),
  expectedWorkspace = resolveConfiguredWorkspace(),
  stderr = console.error,
  exit = process.exit,
} = {}) {
  const [currentPath, expectedPath] = await Promise.all([
    fs.realpath(cwd),
    fs.realpath(expectedWorkspace),
  ]);

  if (currentPath !== expectedPath) {
    stderr(formatWorkspaceCheckFailure(currentPath, expectedPath));
    exit(1);
    return false;
  }

  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await assertWorkspace();
}
