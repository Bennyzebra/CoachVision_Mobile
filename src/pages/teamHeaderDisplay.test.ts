import { strict as assert } from "node:assert";
import { test } from "node:test";
import { getTeamSchoolClubDisplay } from "./teamHeaderDisplay";

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
