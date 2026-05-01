import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  getPositionAssignmentLabel,
  getTeamSchoolClubDisplay,
  getTeamSportRecapLabel,
} from "./teamHeaderDisplay.ts";

test("uses editable profile organization for team header school or club display", () => {
  const display = getTeamSchoolClubDisplay({
    profileOrganization: "Northside Basketball Club",
    teamOrganization: "Legacy Team Org",
    teamSport: "Basketball",
  });

  assert.equal(display, "Northside Basketball Club");
});

test("falls back to team organization and sport when profile organization is blank", () => {
  assert.equal(
    getTeamSchoolClubDisplay({
      profileOrganization: "  ",
      teamOrganization: "Legacy Team Org",
      teamSport: "Basketball",
    }),
    "Legacy Team Org"
  );

  assert.equal(
    getTeamSchoolClubDisplay({
      profileOrganization: undefined,
      teamOrganization: null,
      teamSport: "Basketball",
    }),
    "Basketball"
  );
});

test("formats the sport as a compact team recap label", () => {
  assert.equal(getTeamSportRecapLabel("Basketball"), "Basketball team");
  assert.equal(getTeamSportRecapLabel("  Soccer  "), "Soccer team");
  assert.equal(getTeamSportRecapLabel(""), "Team");
});

test("formats assigned positions against roster size", () => {
  assert.equal(getPositionAssignmentLabel(12, 12), "12 / 12 assigned");
  assert.equal(getPositionAssignmentLabel(9, 12), "9 / 12 assigned");
});
