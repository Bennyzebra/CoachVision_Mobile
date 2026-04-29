import type { FocusDistribution, IntensityPreference, Player } from "@/types";

export type TeamProfileTagWeights = Record<string, number>;

export interface TeamProfileSummary {
  updatedAt: string;
  tagWeights: TeamProfileTagWeights;
  recentThemes: string[];
  strengths: string[];
  weaknesses: string[];
}

export interface TeamProfile {
  roster: {
    total: number;
    guards: number;
    forwards: number;
    centers: number;
    avgHeight: number;
  };
  coachPreferences: {
    focusDistribution?: FocusDistribution;
    intensityPreference?: IntensityPreference;
  };
  recentPracticeThemes: string[];
  strengths: string[];
  weaknesses: string[];
  tagWeights: TeamProfileTagWeights;
}

export interface TeamProfileUpdateInput {
  tagWeights?: TeamProfileTagWeights;
  recentThemes?: string[];
  strengths?: string[];
  weaknesses?: string[];
}

export type PlanDrillSummary = {
  tags?: string[];
  focus?: string;
};

export type PracticePlanSummary = {
  warmup: PlanDrillSummary[];
  main_segment: PlanDrillSummary[];
  cool_down: PlanDrillSummary[];
};

const NEGATIVE_HINTS = [
  "struggle",
  "weak",
  "poor",
  "bad",
  "needs work",
  "need work",
  "lacking",
  "lack",
  "inconsistent",
  "low",
  "issue",
  "problem",
  "fix",
  "improve",
];

const POSITIVE_HINTS = ["strong", "great", "good", "improved", "better", "excellent", "solid"];

const FEEDBACK_TAG_MAP: Array<{ tag: string; keywords: string[] }> = [
  { tag: "transition defense", keywords: ["transition defense", "transition d", "fast break defense"] },
  { tag: "press break", keywords: ["press break", "press-break", "full court press", "pressure"] },
  { tag: "post play", keywords: ["post play", "post-up", "low post", "high post"] },
  { tag: "ball handling", keywords: ["ball handling", "ballhandling", "handle", "dribble"] },
  { tag: "spacing", keywords: ["spacing", "floor spacing"] },
  { tag: "rebounding", keywords: ["rebound", "rebounding", "box out"] },
  { tag: "shooting", keywords: ["shoot", "shooting", "shot selection", "finishing"] },
  { tag: "pick and roll", keywords: ["pick and roll", "pick-and-roll", "pnr"] },
  { tag: "closeouts", keywords: ["closeout", "close-out"] },
];

const DEFAULT_SUMMARY: TeamProfileSummary = {
  updatedAt: new Date(0).toISOString(),
  tagWeights: {},
  recentThemes: [],
  strengths: [],
  weaknesses: [],
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const normalizeTag = (tag: string) => tag.toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

const toInches = (h?: string): number => {
  if (!h) return 0;
  const m = h.match(/(\d+)[′'](\d+)[″"]/); // 6′2″ or 6'2"
  return m ? parseInt(m[1], 10) * 12 + parseInt(m[2], 10) : 0;
};

const buildPreferenceWeights = (focusDistribution?: FocusDistribution): TeamProfileTagWeights => {
  if (!focusDistribution) return {};
  const total = Object.values(focusDistribution).reduce((sum, value) => sum + (Number(value) || 0), 0);
  if (!total) return {};
  const weights: TeamProfileTagWeights = {};
  (Object.keys(focusDistribution) as Array<keyof FocusDistribution>).forEach((key) => {
    const weight = clamp((Number(focusDistribution[key]) || 0) / total, 0, 1);
    if (weight > 0) {
      weights[normalizeTag(key)] = weight;
    }
  });
  return weights;
};

export const computeRoster = (attending: Player[]) => {
  const total = attending.length;
  const guards = attending.filter((p) => p.position === "G").length;
  const forwards = attending.filter((p) => p.position === "F").length;
  const centers = attending.filter((p) => p.position === "C").length;
  const heights = attending.map((p) => toInches(p.height)).filter((h) => h > 0);
  const avgHeight = heights.length ? heights.reduce((a, b) => a + b, 0) / heights.length : 72;
  return { total, guards, forwards, centers, avgHeight };
};

export const buildTeamProfile = (params: {
  attending: Player[];
  coachPreferences?: TeamProfile["coachPreferences"];
  summary?: TeamProfileSummary | null;
}): TeamProfile => {
  const roster = computeRoster(params.attending);
  const summary = params.summary ?? DEFAULT_SUMMARY;
  const preferenceWeights = buildPreferenceWeights(params.coachPreferences?.focusDistribution);
  const tagWeights: TeamProfileTagWeights = { ...preferenceWeights };

  Object.entries(summary.tagWeights || {}).forEach(([tag, weight]) => {
    const normalized = normalizeTag(tag);
    tagWeights[normalized] = Math.max(tagWeights[normalized] ?? 0, clamp(Number(weight) || 0, 0, 1));
  });

  return {
    roster,
    coachPreferences: params.coachPreferences ?? {},
    recentPracticeThemes: summary.recentThemes ?? [],
    strengths: summary.strengths ?? [],
    weaknesses: summary.weaknesses ?? [],
    tagWeights,
  };
};

export const summarizePlanThemes = (plan: PracticePlanSummary) => {
  const tags = new Map<string, number>();
  const drills = [...plan.warmup, ...plan.main_segment, ...plan.cool_down];

  drills.forEach((drill) => {
    const baseTags = [drill.focus, ...(drill.tags || [])].filter(Boolean) as string[];
    baseTags.forEach((tag) => {
      const normalized = normalizeTag(tag);
      if (!normalized) return;
      tags.set(normalized, (tags.get(normalized) || 0) + 1);
    });
  });

  const entries = Array.from(tags.entries()).sort((a, b) => b[1] - a[1]);
  const maxCount = entries[0]?.[1] ?? 1;
  const tagWeights: TeamProfileTagWeights = {};
  entries.forEach(([tag, count]) => {
    tagWeights[tag] = clamp(count / maxCount, 0, 1);
  });

  const recentThemes = entries.slice(0, 4).map(([tag]) => tag);
  return { tagWeights, recentThemes };
};

export const extractFeedbackInsights = (notes: string) => {
  const normalized = notes.toLowerCase();
  const hasNegative = NEGATIVE_HINTS.some((hint) => normalized.includes(hint));
  const hasPositive = POSITIVE_HINTS.some((hint) => normalized.includes(hint));

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const tagWeights: TeamProfileTagWeights = {};

  FEEDBACK_TAG_MAP.forEach(({ tag, keywords }) => {
    const match = keywords.find((keyword) => normalized.includes(keyword));
    if (!match) return;
    const normalizedTag = normalizeTag(tag);
    if (hasNegative && !hasPositive) {
      weaknesses.push(tag);
      tagWeights[normalizedTag] = 1;
    } else if (hasPositive && !hasNegative) {
      strengths.push(tag);
    } else {
      weaknesses.push(tag);
      tagWeights[normalizedTag] = 0.8;
    }
  });

  return { strengths, weaknesses, tagWeights };
};

export const mergeTeamProfileSummary = (
  current: TeamProfileSummary | null | undefined,
  update: TeamProfileUpdateInput
): TeamProfileSummary => {
  const base = current ?? DEFAULT_SUMMARY;
  const tagWeights: TeamProfileTagWeights = {};
  const decay = 0.9;

  Object.entries(base.tagWeights || {}).forEach(([tag, weight]) => {
    tagWeights[normalizeTag(tag)] = clamp((Number(weight) || 0) * decay, 0, 1);
  });

  Object.entries(update.tagWeights || {}).forEach(([tag, weight]) => {
    const normalized = normalizeTag(tag);
    const blended = (tagWeights[normalized] || 0) + clamp(Number(weight) || 0, 0, 1) * 0.2;
    tagWeights[normalized] = clamp(blended, 0, 1);
  });

  const recentThemes = Array.from(
    new Set([...(update.recentThemes || []), ...(base.recentThemes || [])])
  ).slice(0, 6);

  const strengths = Array.from(new Set([...(update.strengths || []), ...(base.strengths || [])])).slice(0, 6);
  const weaknesses = Array.from(new Set([...(update.weaknesses || []), ...(base.weaknesses || [])])).slice(0, 6);

  return {
    updatedAt: new Date().toISOString(),
    tagWeights,
    recentThemes,
    strengths,
    weaknesses,
  };
};

export const humanizeTag = (tag: string) => tag.replace(/[_-]+/g, " ").trim();

export const buildExplainWhyFromTeamProfile = (params: {
  teamProfile?: TeamProfile;
  drill: PlanDrillSummary;
  sessionFocus?: string;
}): string | undefined => {
  const profile = params.teamProfile;
  if (!profile) return undefined;
  if (!Object.keys(profile.tagWeights || {}).length) return undefined;

  const drillTags = new Set([...(params.drill.tags || []), params.drill.focus].filter(Boolean) as string[]);
  const matchCandidates = Array.from(drillTags)
    .map((tag) => ({
      tag,
      normalized: normalizeTag(tag),
      weight: profile.tagWeights[normalizeTag(tag)] ?? 0,
    }))
    .filter((entry) => entry.weight > 0);

  if (!matchCandidates.length) return undefined;
  matchCandidates.sort((a, b) => b.weight - a.weight);
  const top = matchCandidates[0];

  const normalizedWeaknesses = profile.weaknesses.map((weakness) => normalizeTag(weakness));
  const weaknessHit = normalizedWeaknesses.some(
    (weakness) => weakness && (top.normalized.includes(weakness) || weakness.includes(top.normalized))
  );

  if (weaknessHit) {
    return `Selected to target low efficiency in ${humanizeTag(top.tag)} across recent sessions.`;
  }

  const normalizedThemes = profile.recentPracticeThemes.map((theme) => normalizeTag(theme));
  const themeHit = normalizedThemes.some(
    (theme) => theme && (top.normalized.includes(theme) || theme.includes(top.normalized))
  );

  if (themeHit) {
    return `Selected to reinforce the recent emphasis on ${humanizeTag(top.tag)}.`;
  }

  if (
    params.sessionFocus &&
    params.sessionFocus !== "balanced" &&
    params.sessionFocus === params.drill.focus
  ) {
    return `Selected to reinforce your ${params.drill.focus} focus for this practice.`;
  }

  return `Selected to align with the team's current profile priorities in ${humanizeTag(top.tag)}.`;
};