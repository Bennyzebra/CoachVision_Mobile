import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Metadata checks do not trigger downloads of iCloud placeholders.
export function assertLocalFiles(root = fileURLToPath(new URL("../", import.meta.url))) {
  if (!existsSync(`${root}/node_modules`)) {
    throw new Error("Dependencies are missing. Run npm ci before building or testing.");
  }
  if (process.platform !== "darwin") return;
  const result = spawnSync("/usr/bin/find", ["-L", "node_modules", "-flags", "+dataless", "-print", "-quit"], {
    cwd: root,
    encoding: "utf8",
    timeout: 10_000,
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Could not check local files: ${result.error?.message || result.stderr}`);
  }
  if (result.stdout.trim()) {
    throw new Error(
      `Cloud-offloaded file: ${result.stdout.trim()}\n` +
      "The build would wait for a cloud download. In Finder, choose Keep Downloaded for this checkout, " +
      "or move it outside iCloud-synced Documents/Desktop. For offloaded node_modules, reinstall with npm ci.",
    );
  }
}
