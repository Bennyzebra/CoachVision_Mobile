import { strict as assert } from "node:assert";
import { test } from "node:test";
import { createTeamProfileSummaryUpdater } from "./teamProfileSummaryUpdater.ts";
import { isMissingTeamProfileSummaryColumnError } from "./teamProfileSummaryErrors.ts";

test("detects missing team profile summary column errors", () => {
  assert.equal(
    isMissingTeamProfileSummaryColumnError({
      code: "42703",
      message: "column teams.team_profile_summary does not exist",
      details: null,
      hint: null,
    }),
    true
  );

  assert.equal(
    isMissingTeamProfileSummaryColumnError({
      code: "PGRST204",
      message: "Could not find the 'team_profile_summary' column of 'teams' in the schema cache",
    }),
    true
  );
});

test("does not treat unrelated Supabase errors as missing team profile summary", () => {
  assert.equal(
    isMissingTeamProfileSummaryColumnError({
      code: "42501",
      message: "permission denied for table teams",
    }),
    false
  );

  assert.equal(isMissingTeamProfileSummaryColumnError(null), false);
});

test("skips practice plan summary updates when the summary column is missing on fetch", async () => {
  let updateCalls = 0;
  const updater = createTeamProfileSummaryUpdater({
    fetch: async () => ({
      data: null,
      error: {
        code: "42703",
        message: "column teams.team_profile_summary does not exist",
      },
    }),
    update: async () => {
      updateCalls += 1;
      return { error: null };
    },
  });

  await updater.updateFromPracticePlan("team-1", {
    warmup: [{ focus: "offense", tags: ["spacing"] }],
    main_segment: [],
    cool_down: [],
  });

  assert.equal(updateCalls, 0);
});

test("treats a missing summary column during update as a no-op", async () => {
  let updateCalls = 0;
  const updater = createTeamProfileSummaryUpdater({
    fetch: async () => ({ data: null, error: null }),
    update: async () => {
      updateCalls += 1;
      return {
        error: {
          code: "PGRST204",
          message: "Could not find the 'team_profile_summary' column of 'teams' in the schema cache",
        },
      };
    },
  });

  await updater.updateFromFeedback("team-1", "Need work on spacing and rebounding.");

  assert.equal(updateCalls, 1);
});
