import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertLocalFiles } from "./check-local-files.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const testFilePattern = /\.test\.(?:ts|mjs|js|cjs)$/;

export async function findTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return findTestFiles(path);
      if (/\.(?:test|spec)(?: \d+)?\.[cm]?[jt]sx?$/.test(entry.name) && !testFilePattern.test(entry.name)) {
        throw new Error(`Unsupported test filename: ${path}. Use .test.ts, .test.mjs, .test.js or .test.cjs; JSX requires a separate renderer/loader.`);
      }
      return testFilePattern.test(entry.name) ? [path] : [];
    })
  );

  return nestedFiles.flat();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  assertLocalFiles(root);
  const testRoots = ["src", "supabase/functions", "ios/App/App", "scripts"];
  const testFiles = (await Promise.all(testRoots.map((directory) => findTestFiles(join(root, directory))))).flat().sort();

  if (testFiles.length === 0) {
    throw new Error("No test files were found.");
  }

  console.log(`Running ${testFiles.length} test files (unit tests and source-structure checks).`);
  const result = spawnSync(process.execPath, ["--experimental-strip-types", "--test", ...testFiles], {
    stdio: "inherit",
    cwd: root,
  });

  if (result.error) console.error(result.error);
  process.exit(result.status ?? 1);
}
