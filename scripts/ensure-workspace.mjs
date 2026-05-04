import fs from "node:fs/promises";

const configuredWorkspace =
  process.env.COACHVISION_WORKSPACE ||
  "/Users/bensheegog/Documents/GitHub/CoachVision_Mobile";

async function assertWorkspace() {
  const [currentPath, expectedPath] = await Promise.all([
    fs.realpath(process.cwd()),
    fs.realpath(configuredWorkspace),
  ]);

  if (currentPath !== expectedPath) {
    console.error("Workspace check failed.");
    console.error(`Current:  ${currentPath}`);
    console.error(`Expected: ${expectedPath}`);
    console.error(
      "Run: cd /Users/bensheegog/Documents/GitHub/CoachVision_Mobile"
    );
    process.exit(1);
  }
}

await assertWorkspace();
