import { strict as assert } from "node:assert";
import { test } from "node:test";

import {
  addPracticePriority,
  createInitialTeamDraft,
  createPlayerDraft,
  formatPlayerHeight,
  getRosterErrors,
  getStepErrors,
  isStepValid,
} from "./createTeamDraft.ts";

const makeValidDraft = () => {
  const draft = createInitialTeamDraft();
  draft.teamName = "Northside Hoops";
  draft.practicePriorities = ["Fundamentals"];
  draft.coachingNotes = "Keep instructions short and clear.";
  draft.players = [createPlayerDraft(), createPlayerDraft()].map((player, index) => ({
    ...player,
    name: index === 0 ? "Avery" : "Jordan",
    position: index === 0 ? "G" : "F",
    heightFeet: index === 0 ? "5" : "6",
    heightInches: index === 0 ? "8" : "0",
  }));
  return draft;
};

test("requires team identity and keeps optional organization valid", () => {
  const draft = createInitialTeamDraft();
  assert.equal(isStepValid(draft, 0), false);
  assert.match(getStepErrors(draft, 0).teamName, /team name/i);

  draft.teamName = "Falcons";
  assert.equal(isStepValid(draft, 0), true);
});

test("validates the required team age range", () => {
  const draft = makeValidDraft();
  draft.ageRangeMin = "18";
  draft.ageRangeMax = "14";
  assert.match(getStepErrors(draft, 1).ageRangeMax, /greater than or equal/i);

  draft.ageRangeMax = "18";
  assert.equal(isStepValid(draft, 1), true);
});

test("requires practice priorities and nonblank coaching notes", () => {
  const draft = createInitialTeamDraft();
  assert.match(getStepErrors(draft, 1).practicePriorities, /priority/i);
  assert.match(getStepErrors(draft, 1).coachingNotes, /coaching notes/i);

  draft.practicePriorities = ["Defense"];
  draft.coachingNotes = "  ";
  assert.match(getStepErrors(draft, 1).coachingNotes, /coaching notes/i);

  draft.coachingNotes = "A".repeat(501);
  assert.equal(isStepValid(draft, 1), true);
});

test("adds trimmed custom priorities without duplicates", () => {
  const priorities = ["Defense"];
  assert.deepEqual(addPracticePriority(priorities, "  Rebounding focus  "), ["Defense", "Rebounding focus"]);
  assert.equal(addPracticePriority(priorities, " defense "), priorities);
  assert.equal(addPracticePriority(priorities, "  "), priorities);
});

test("starts with an empty roster and still needs two players", () => {
  const draft = createInitialTeamDraft();
  assert.equal(draft.players.length, 0);
  assert.match(getRosterErrors(draft).players, /at least two/i);
});

test("requires two complete players", () => {
  const draft = makeValidDraft();
  draft.players = [draft.players[0]];
  assert.match(getRosterErrors(draft).players, /at least two/i);

  draft.players.push({ ...draft.players[0], id: "second", name: "Sam", position: "" });
  assert.match(getRosterErrors(draft)["players.second.position"], /position/i);
});

test("rejects duplicate normalized jersey numbers", () => {
  const draft = makeValidDraft();
  draft.players[0].jerseyNumber = "04";
  draft.players[1].jerseyNumber = "4";
  const errors = getRosterErrors(draft);
  assert.match(errors[`players.${draft.players[0].id}.jerseyNumber`], /unique/i);
  assert.match(errors[`players.${draft.players[1].id}.jerseyNumber`], /unique/i);
});

test("does not collect individual player age", () => {
  const draft = makeValidDraft();
  assert.equal(isStepValid(draft, 3), true);
  assert.equal("age" in draft.players[0], false);
});

test("requires both player height fields and validates their bounds", () => {
  const draft = makeValidDraft();
  draft.players[0].heightFeet = "";
  draft.players[1].heightInches = "12";

  const errors = getRosterErrors(draft);
  assert.match(errors[`players.${draft.players[0].id}.heightFeet`], /height/i);
  assert.match(errors[`players.${draft.players[1].id}.heightInches`], /0 to 11/i);
  assert.equal(isStepValid(draft, 3), false);
});

test("normalizes a valid required player height", () => {
  const player = makeValidDraft().players[0];
  player.heightFeet = "6";
  player.heightInches = "2";
  assert.equal(formatPlayerHeight(player), "6'2\"");
});
