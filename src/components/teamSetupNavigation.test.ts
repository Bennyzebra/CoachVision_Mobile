import { strict as assert } from "node:assert";
import { test } from "node:test";

import { getTeamSetupDestination } from "./teamSetupNavigation.ts";

test("waits for team loading before choosing a destination", () => {
  assert.equal(
    getTeamSetupDestination({ pathname: "/", teamCount: 0, teamsLoading: true, teamsError: null }),
    null
  );
});

test("routes zero-team users into onboarding", () => {
  assert.equal(
    getTeamSetupDestination({ pathname: "/drills", teamCount: 0, teamsLoading: false, teamsError: null }),
    "/onboarding"
  );
});

test("keeps zero-team users on onboarding and redirects configured users home", () => {
  assert.equal(
    getTeamSetupDestination({ pathname: "/onboarding", teamCount: 0, teamsLoading: false, teamsError: null }),
    null
  );
  assert.equal(
    getTeamSetupDestination({ pathname: "/onboarding", teamCount: 1, teamsLoading: false, teamsError: null }),
    "/"
  );
});

test("does not navigate when the team query failed", () => {
  assert.equal(
    getTeamSetupDestination({ pathname: "/", teamCount: 0, teamsLoading: false, teamsError: "offline" }),
    null
  );
});
