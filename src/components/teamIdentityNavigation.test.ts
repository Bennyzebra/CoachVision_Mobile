import { strict as assert } from "node:assert";
import { test } from "node:test";
import { TEAM_IDENTITY_DESTINATION } from "./teamIdentityNavigation.ts";

test("top-left team identity navigates to the team and roster page", () => {
  assert.equal(TEAM_IDENTITY_DESTINATION, "/team");
});
