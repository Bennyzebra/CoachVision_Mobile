export type TeamLevel = "beginner" | "intermediate" | "advanced";
export type PlayerPosition = "G" | "F" | "C" | "";

export interface PlayerDraft {
  id: string;
  name: string;
  jerseyNumber: string;
  position: PlayerPosition;
  heightFeet: string;
  heightInches: string;
}

export interface CreateTeamDraft {
  teamName: string;
  sport: "Basketball";
  organization: string;
  ageRangeMin: string;
  ageRangeMax: string;
  teamLevel: TeamLevel;
  practicePriorities: string[];
  coachingNotes: string;
  practicesPerWeek: string;
  defaultPracticeDuration: string;
  courtAvailability: string;
  basketCount: string;
  equipment: string[];
  players: PlayerDraft[];
}

export type CreateTeamStep = 0 | 1 | 2 | 3 | 4;

export type DraftErrors = Record<string, string>;

export const CREATE_TEAM_STEP_COUNT = 5;
export const MIN_PLAYER_AGE = 5;
export const MAX_PLAYER_AGE = 99;

let fallbackPlayerId = 0;

export const createPlayerDraft = (): PlayerDraft => ({
  id:
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `player-${Date.now()}-${fallbackPlayerId++}`,
  name: "",
  jerseyNumber: "",
  position: "",
  heightFeet: "",
  heightInches: "",
});

export const createInitialTeamDraft = (): CreateTeamDraft => ({
  teamName: "",
  sport: "Basketball",
  organization: "",
  ageRangeMin: "11",
  ageRangeMax: "14",
  teamLevel: "intermediate",
  practicePriorities: [],
  coachingNotes: "",
  practicesPerWeek: "",
  defaultPracticeDuration: "",
  courtAvailability: "",
  basketCount: "",
  equipment: [],
  players: [],
});

export const addPracticePriority = (priorities: string[], value: string): string[] => {
  const priority = value.trim();
  if (!priority || priorities.some((item) => item.toLocaleLowerCase() === priority.toLocaleLowerCase())) {
    return priorities;
  }
  return [...priorities, priority];
};

const integerInRange = (value: string, min: number, max: number) => {
  if (!/^\d+$/.test(value)) return false;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max;
};

export const formatPlayerHeight = (player: PlayerDraft) => {
  if (!player.heightFeet && !player.heightInches) return "";
  if (!integerInRange(player.heightFeet, 3, 8) || !integerInRange(player.heightInches, 0, 11)) {
    return "";
  }
  return `${Number(player.heightFeet)}'${Number(player.heightInches)}"`;
};

export const getTeamIdentityErrors = (draft: CreateTeamDraft): DraftErrors => {
  const errors: DraftErrors = {};
  const name = draft.teamName.trim();
  if (!name) errors.teamName = "Enter your team name.";
  else if (name.length < 2) errors.teamName = "Team name must be at least 2 characters.";
  else if (name.length > 60) errors.teamName = "Team name must be 60 characters or fewer.";
  if (draft.organization.trim().length > 80) {
    errors.organization = "Organization must be 80 characters or fewer.";
  }
  return errors;
};

export const getTeamProfileErrors = (draft: CreateTeamDraft): DraftErrors => {
  const errors: DraftErrors = {};
  if (!integerInRange(draft.ageRangeMin, MIN_PLAYER_AGE, MAX_PLAYER_AGE)) {
    errors.ageRangeMin = `Enter an age from ${MIN_PLAYER_AGE} to ${MAX_PLAYER_AGE}.`;
  }
  if (!integerInRange(draft.ageRangeMax, MIN_PLAYER_AGE, MAX_PLAYER_AGE)) {
    errors.ageRangeMax = `Enter an age from ${MIN_PLAYER_AGE} to ${MAX_PLAYER_AGE}.`;
  }
  if (!errors.ageRangeMin && !errors.ageRangeMax && Number(draft.ageRangeMin) > Number(draft.ageRangeMax)) {
    errors.ageRangeMax = "Maximum age must be greater than or equal to minimum age.";
  }
  if (!draft.teamLevel) errors.teamLevel = "Choose a team skill level.";
  if (!draft.practicePriorities.some((priority) => priority.trim())) {
    errors.practicePriorities = "Choose or add a practice priority.";
  }
  if (!draft.coachingNotes.trim()) errors.coachingNotes = "Enter coaching notes.";
  return errors;
};

export const getPracticeEnvironmentErrors = (draft: CreateTeamDraft): DraftErrors => {
  const errors: DraftErrors = {};
  if (draft.practicesPerWeek && !integerInRange(draft.practicesPerWeek, 1, 7)) {
    errors.practicesPerWeek = "Enter 1 to 7 practices per week.";
  }
  return errors;
};

export const getRosterErrors = (draft: CreateTeamDraft): DraftErrors => {
  const errors: DraftErrors = {};
  if (draft.players.length < 2) {
    errors.players = "Add at least two players so CoachVision can build a usable practice plan.";
  }

  const jerseyOwners = new Map<string, string[]>();
  draft.players.forEach((player, index) => {
    const prefix = `players.${player.id}`;
    if (!player.name.trim()) errors[`${prefix}.name`] = `Enter a name for Player ${index + 1}.`;
    if (!player.position) errors[`${prefix}.position`] = "Choose a position.";

    if (player.jerseyNumber) {
      if (!integerInRange(player.jerseyNumber, 0, 99)) {
        errors[`${prefix}.jerseyNumber`] = "Use a jersey number from 0 to 99.";
      } else {
        const normalized = String(Number(player.jerseyNumber));
        jerseyOwners.set(normalized, [...(jerseyOwners.get(normalized) ?? []), prefix]);
      }
    }

    if (!integerInRange(player.heightFeet, 3, 8)) {
      errors[`${prefix}.heightFeet`] = "Enter a height from 3 to 8 feet.";
    }
    if (!integerInRange(player.heightInches, 0, 11)) {
      errors[`${prefix}.heightInches`] = "Enter inches from 0 to 11.";
    }
  });

  jerseyOwners.forEach((owners) => {
    if (owners.length < 2) return;
    owners.forEach((prefix) => {
      errors[`${prefix}.jerseyNumber`] = "Jersey numbers must be unique.";
    });
  });

  return errors;
};

export const getStepErrors = (draft: CreateTeamDraft, step: CreateTeamStep): DraftErrors => {
  if (step === 0) return getTeamIdentityErrors(draft);
  if (step === 1) return getTeamProfileErrors(draft);
  if (step === 2) return getPracticeEnvironmentErrors(draft);
  if (step === 3) return getRosterErrors(draft);
  return {};
};

export const isStepValid = (draft: CreateTeamDraft, step: CreateTeamStep) =>
  Object.keys(getStepErrors(draft, step)).length === 0;
