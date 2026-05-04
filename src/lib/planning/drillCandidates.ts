export const PRACTICE_PLAN_DRILL_CANDIDATE_LIMIT = 60;

export type PracticePlanCandidateDrill = {
  id: string;
  name?: string;
  focus?: string;
  category?: string;
  duration?: number;
  duration_min?: number;
  rating?: number;
  verified?: boolean;
  description?: string;
  tags?: string[];
  focus_tags?: string[];
  level?: string;
};

export type PracticePlanCandidateOptions = {
  focus: string;
  duration: number;
  ageGroup: string;
  goals?: string;
  recentDrillIds?: string[];
  limit?: number;
};

const focusAliases: Record<string, string[]> = {
  offense: ["offense", "offensive", "attack", "scoring"],
  defense: ["defense", "defensive", "closeout", "pressure"],
  conditioning: ["conditioning", "fitness", "cardio", "endurance"],
  passing: ["passing", "pass", "ball movement", "ball-movement"],
  "ball-movement": ["ball movement", "ball-movement", "passing", "movement"],
  shooting: ["shooting", "shot", "finishing", "scoring"],
};

const levelOrder = ["beginner", "intermediate", "advanced"];

const normalizeText = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getDrillDuration = (drill: PracticePlanCandidateDrill) =>
  Number(drill.duration ?? drill.duration_min ?? 10) || 10;

const getFocusTerms = (focus: string, goals?: string) => {
  const normalizedFocus = normalizeText(focus);
  const goalTerms = normalizeText(goals)
    .split(/[\s,.;:!?/]+/)
    .filter((term) => term.length > 2);

  return new Set([normalizedFocus, ...(focusAliases[normalizedFocus] ?? []), ...goalTerms]);
};

const scoreFocusFit = (drill: PracticePlanCandidateDrill, focusTerms: Set<string>) => {
  const fieldValues = [
    drill.focus,
    drill.category,
    drill.name,
    drill.description,
    ...(drill.tags ?? []),
    ...(drill.focus_tags ?? []),
  ].map(normalizeText);

  let score = 0;
  fieldValues.forEach((value, index) => {
    if (!value) return;

    focusTerms.forEach((term) => {
      if (!term) return;
      if (value === term) score += index <= 1 ? 28 : 12;
      else if (value.includes(term)) score += index <= 1 ? 18 : 8;
    });
  });

  return score;
};

const scoreLevelFit = (drill: PracticePlanCandidateDrill, ageGroup: string) => {
  const drillLevel = normalizeText(drill.level);
  const sessionLevel = normalizeText(ageGroup);

  if (!drillLevel || !sessionLevel) return 4;
  if (drillLevel === sessionLevel) return 12;

  const drillIndex = levelOrder.indexOf(drillLevel);
  const sessionIndex = levelOrder.indexOf(sessionLevel);
  if (drillIndex === -1 || sessionIndex === -1) return 2;

  const distance = Math.abs(drillIndex - sessionIndex);
  if (distance === 1) return 5;
  return -10;
};

export function selectPracticePlanCandidateDrills<T extends PracticePlanCandidateDrill>(
  drills: T[],
  options: PracticePlanCandidateOptions,
): T[] {
  if (!drills.length) return [];

  const limit = Math.max(1, options.limit ?? PRACTICE_PLAN_DRILL_CANDIDATE_LIMIT);
  const focusTerms = getFocusTerms(options.focus, options.goals);
  const recentDrillIds = new Set(options.recentDrillIds ?? []);
  const maxDrillDuration = Math.max(5, Number(options.duration) || 0);

  return drills
    .map((drill, index) => {
      const drillDuration = getDrillDuration(drill);
      const isRecent = recentDrillIds.has(drill.id);
      const focusScore = scoreFocusFit(drill, focusTerms);
      const durationScore = Math.max(0, 14 - Math.abs(drillDuration - maxDrillDuration / 5));
      const ratingScore = Math.min(5, Math.max(0, Number(drill.rating ?? 0))) * 1.5;
      const verifiedScore = drill.verified ? 4 : 0;

      return {
        drill,
        index,
        drillDuration,
        score:
          focusScore +
          durationScore +
          scoreLevelFit(drill, options.ageGroup) +
          ratingScore +
          verifiedScore -
          (isRecent ? 35 : 0),
      };
    })
    .filter((candidate) => candidate.drillDuration <= maxDrillDuration)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.min(limit, drills.length))
    .map((candidate) => candidate.drill);
}
