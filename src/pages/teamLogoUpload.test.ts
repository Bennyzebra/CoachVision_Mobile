import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  getTeamLogoFileExtension,
  getTeamLogoStoragePath,
  validateTeamLogoFile,
} from "./teamLogoUpload.ts";

test("accepts supported team logo image files under the size limit", () => {
  const file = new File(["logo"], "logo.png", { type: "image/png" });

  assert.equal(validateTeamLogoFile(file), null);
});

test("rejects unsupported team logo file types", () => {
  const file = new File(["logo"], "logo.gif", { type: "image/gif" });

  assert.equal(
    validateTeamLogoFile(file),
    "Choose a PNG, JPG, or WebP image for your team photo."
  );
});

test("rejects team logo image files over five megabytes", () => {
  const file = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "logo.jpg", {
    type: "image/jpeg",
  });

  assert.equal(validateTeamLogoFile(file), "Team photos must be 5 MB or smaller.");
});

test("builds a coach-owned team logo storage path with the expected extension", () => {
  const file = new File(["logo"], "logo.webp", { type: "image/webp" });

  assert.equal(getTeamLogoFileExtension(file), "webp");
  assert.equal(
    getTeamLogoStoragePath({
      coachId: "coach-123",
      teamId: "team-456",
      file,
      timestamp: 1777663683000,
    }),
    "coach-123/team-456-1777663683000.webp"
  );
});
