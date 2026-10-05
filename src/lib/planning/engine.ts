// src/lib/planning/engine.ts
import type { Drill, FocusDistribution, PlanItem, Player } from "@/types";
import type { TeamProfile } from "@/lib/planning/teamProfile";
import { humanizeTag, normalizeTag as normalizeProfileTag } from "@/lib/planning/teamProfile";
import { getExpectedIntensityForPreference } from "@/lib/planning/intensityPreference";

/** Extend your types if needed (all optional → backward compatible) */
export type Position = "G" | "F" | "C";
export type TeamLevel = "beginner" | "intermediate" | "advanced";

export interface SessionContext {
  attending: Array<Player & { present?: boolean }>;
  focus: "balanced" | "offense" | "defense" | "passing" | "conditioning";
  goalsText: string;
  teamLevel: TeamLevel;
  duration: number; // minutes
  lastUsedDrillIds?: string[]; // for cooldown
  focusDistribution?: FocusDistribution;  
  intensityPreference?: TeamProfile["coachPreferences"]["intensityPreference"];
  teamProfile?: TeamProfile;  
  teamDrillOutcomes?: Record<string, TeamDrillOutcome>;
  feedback?: {
    drillId: string;
    mood: "happy" | "neutral" | "sad";
  }[];
}

export interface DrillMeta extends Drill {
  /** New optional fields that make the algorithm smarter */
  minPlayers?: number;           // e.g., 2
  maxPlayers?: number;           // e.g., 12
  optimalGroupSize?: number;     // e.g., 3, 4, 5
  level?: TeamLevel;             // intended difficulty
  intensity?: 1 | 2 | 3 | 4 | 5; // 1 warmup → 5 gassers
  positionsEmphasis?: Partial<Record<Position, number>>; // e.g., { G: 0.7, F: 0.3 }
  requiresFullCourt?: boolean;
  tags?: string[];               // "small-group","full-squad","post","ball-handler", etc.
  verified?: boolean;
  /** Keep your existing properties (id, name, focus, rating, duration, etc.) */
}

export interface TeamDrillOutcome {
  avgCompletionPercent?: number | null;
  avgFeedbackRating?: number | null;
  totalSessions?: number | null;
}

export type Weights = {
  baseRating: number;
  playerCountFit: number;
  positionMatch: number;
  heightFit: number;
  focusMatch: number;
  goalsMatch: number;
  levelFit: number;
  intensityFit: number;
  tagsMatch: number;
  teamProfileFit: number;  
  courtFit: number;
  durationFit: number;
  feedbackBoost: number;
  recencyPenalty: number;
  noveltyVariety: number;
  teamEffectivenessBoost: number;  
};

export const DEFAULT_WEIGHTS: Weights = {
  baseRating: 1.0,
  playerCountFit: 1.4,
  positionMatch: 0.9,
  heightFit: 0.7,
  focusMatch: 1.2,
  goalsMatch: 1.1,
  levelFit: 0.8,
  intensityFit: 0.6,
  tagsMatch: 0.9,
  teamProfileFit: 0.7,  
  courtFit: 0.5,
  durationFit: 0.7,
  feedbackBoost: 1.0,
  recencyPenalty: 1.0,
  noveltyVariety: 0.6,
  teamEffectivenessBoost: 0.8,  
};

const GOAL_KEYWORDS: Record<string, string[]> = {
  offense: ["shoot", "shooting", "finishing", "score", "spacing", "layup", "pick and roll", "pnr", "iso"],
  defense: ["shell", "closeout", "rebound", "rebounding", "press", "rotation", "help", "deny"],
  passing: ["weave", "star passing", "ball movement", "assist", "outlet", "kickout"],
  conditioning: ["sprint", "suicide", "transition", "game speed", "stamina", "endurance", "lungs"],
  guards: ["guard", "handle", "ball handling", "dribble", "perimeter"],
  posts: ["post", "paint", "seal", "box out", "screen"],
};

type FocusArea = keyof FocusDistribution;
type SegmentType = "warmup" | "main" | "cooldown";

const DEFAULT_FOCUS_DISTRIBUTION: FocusDistribution = {
  offense: 40,
  defense: 40,
  conditioning: 20,
};

function toInches(h?: string): number {
  if (!h) return 0;
  const m = h.match(/(\d+)[′'](\d+)[″"]/); // 6′2″ or 6'2"
  return m ? parseInt(m[1], 10) * 12 + parseInt(m[2], 10) : 0;
}

export function computeStats(attending: SessionContext["attending"]) {
  const present = attending.filter((player) => player.present !== false);
  const total = present.length;
  const guards = present.filter(p => p.position === "G").length;
  const forwards = present.filter(p => p.position === "F").length;
  const centers = present.filter(p => p.position === "C").length;

  const heights = present.map((player) => toInches(player.height)).filter((height) => height > 0);
  const avgHeight = heights.length ? heights.reduce((a,b)=>a+b,0)/heights.length : 72;

  // majority level (fallback intermediate)
  const levelVotes: Record<TeamLevel, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  present.forEach((player) => {
    const lvl = player.experience ?? "intermediate";
    levelVotes[lvl] = (levelVotes[lvl] || 0) + 1;
  });
  const majorityLevel = (Object.entries(levelVotes).sort((a,b)=>b[1]-a[1])[0]?.[0] || "intermediate") as TeamLevel;

  return { total, guards, forwards, centers, avgHeight, majorityLevel };
}

function cosineLike(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const na = Math.sqrt(a.reduce((s, ai) => s + ai * ai, 0));
  const nb = Math.sqrt(b.reduce((s, bi) => s + bi * bi, 0));
  if (!na || !nb) return 0;
  return dot / (na * nb);
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}
function normalizeFocusDistribution(distribution?: FocusDistribution): FocusDistribution {
  const input = distribution ?? DEFAULT_FOCUS_DISTRIBUTION;
  const total = Object.values(input).reduce((sum, value) => sum + (Number(value) || 0), 0);
  if (total <= 0) return DEFAULT_FOCUS_DISTRIBUTION;

  const areas: FocusArea[] = ["offense", "defense", "conditioning"];
  const normalized = {} as FocusDistribution;
  let remaining = 100;

  areas.forEach((area, index) => {
    if (index === areas.length - 1) {
      normalized[area] = Math.max(0, remaining);
      return;
    }
    const raw = ((Number(input[area]) || 0) / total) * 100;
    const rounded = Math.max(0, Math.round(raw));
    normalized[area] = rounded;
    remaining -= rounded;
  });

  return normalized;
}

function mapFocusToArea(focus: Drill["focus"] | SessionContext["focus"]): FocusArea {
  if (focus === "conditioning") return "conditioning";
  if (focus === "defense") return "defense";
  return "offense";
}

function buildSegmentTargets(totalMinutes: number) {
  const minSegment = totalMinutes >= 30 ? 6 : 5;
  const maxSegment = Math.max(minSegment, Math.round(totalMinutes * 0.25));
  let warmup = clamp(Math.round(totalMinutes * 0.15), minSegment, maxSegment);
  let cooldown = clamp(Math.round(totalMinutes * 0.15), minSegment, maxSegment);
  let main = totalMinutes - warmup - cooldown;

  if (main < minSegment) {
    const deficit = minSegment - main;
    const warmupGive = Math.min(deficit, warmup - minSegment);
    warmup -= warmupGive;
    const cooldownGive = Math.min(deficit - warmupGive, cooldown - minSegment);
    cooldown -= cooldownGive;
    main = totalMinutes - warmup - cooldown;
  }

  return { warmup, main, cooldown };
}

function allocateFocusTargets(mainMinutes: number, distribution: FocusDistribution) {
  const normalized = normalizeFocusDistribution(distribution);
  const areas: FocusArea[] = ["offense", "defense", "conditioning"];
  const targets = {} as Record<FocusArea, number>;
  let allocated = 0;

  areas.forEach((area, index) => {
    if (index === areas.length - 1) {
      targets[area] = Math.max(0, mainMinutes - allocated);
    } else {
      const raw = Math.round((normalized[area] / 100) * mainMinutes);
      targets[area] = raw;
      allocated += raw;
    }
  });

  return targets;
}

function textGoalMatch(goalsText: string, drill: DrillMeta): number {
  if (!goalsText?.trim()) return 0;
  const g = goalsText.toLowerCase();
  let score = 0;

  const allWords = new Set<string>([
    ...Object.values(GOAL_KEYWORDS).flat(),
    ...(drill.tags || []),
    drill.focus,
    drill.name.toLowerCase(),
  ]);
  for (const kw of allWords) if (kw && g.includes(kw.toLowerCase())) score += 1;

  // small bonus for focus-aligned keywords
  const focusWords = GOAL_KEYWORDS[drill.focus] || [];
  for (const kw of focusWords) if (g.includes(kw)) score += 0.5;

  // normalize rough range to [0..1]
  return clamp(score / 6, 0, 1);
}

function normalizeTag(tag: string): string {
  return tag.toLowerCase().replace(/[\s_-]+/g, "");
}

function teamProfileFit(teamProfile: TeamProfile | undefined, drill: DrillMeta): number {
  if (!teamProfile || !Object.keys(teamProfile.tagWeights || {}).length) return 0.5;
  const tags = new Set([...(drill.tags || []), drill.focus]);
  const scores = Array.from(tags).map((tag) => {
    const normalized = normalizeProfileTag(tag);
    return teamProfile.tagWeights[normalized] ?? 0;
  });
  if (!scores.length) return 0.5;
  return clamp(Math.max(...scores), 0, 1);
}

function buildExplainWhy(session: SessionContext, drill: DrillMeta): string | undefined {
  const profile = session.teamProfile;
  if (!profile) return undefined;
  const drillTags = new Set([...(drill.tags || []), drill.focus]);
  const matchCandidates = Array.from(drillTags)
    .map((tag) => ({
      tag,
      normalized: normalizeProfileTag(tag),
      weight: profile.tagWeights[normalizeProfileTag(tag)] ?? 0,
    }))
    .filter((entry) => entry.weight > 0);

  if (!matchCandidates.length) return undefined;
  matchCandidates.sort((a, b) => b.weight - a.weight);
  const top = matchCandidates[0];

  const normalizedWeaknesses = profile.weaknesses.map((weakness) => normalizeProfileTag(weakness));
  const weaknessHit = normalizedWeaknesses.some(
    (weakness) => weakness && (top.normalized.includes(weakness) || weakness.includes(top.normalized))
  );

  if (weaknessHit) {
    return `Selected to target low efficiency in ${humanizeTag(top.tag)} across recent sessions.`;
  }

  const normalizedThemes = profile.recentPracticeThemes.map((theme) => normalizeProfileTag(theme));
  const themeHit = normalizedThemes.some(
    (theme) => theme && (top.normalized.includes(theme) || theme.includes(top.normalized))
  );

  if (themeHit) {
    return `Selected to reinforce the recent emphasis on ${humanizeTag(top.tag)}.`;
  }

  if (session.focus !== "balanced" && session.focus === drill.focus) {
    return `Selected to reinforce your ${drill.focus} focus for this practice.`;
  }

  return `Selected to align with the team's current profile priorities in ${humanizeTag(top.tag)}.`;
}


function tagsGoalMatch(goalsText: string, drill: DrillMeta): number {
  if (!goalsText?.trim() || !drill.tags?.length) return 0;
  const g = goalsText.toLowerCase();
  const tokens = drill.tags.map(t => normalizeTag(t));
  const hits = tokens.filter(t => t && g.includes(t));
  return clamp(hits.length / Math.max(3, tokens.length), 0, 1);
}


function playerCountFit(total: number, d: DrillMeta): number {
  const min = d.minPlayers ?? 1;
  const max = d.maxPlayers ?? 100;
  if (total < min) return (total / min) * 0.3;                // harsh penalty if too few
  if (total > max) return clamp(max / total, 0.3, 1);         // penalize if too many
  // within range: closer to optimalGroupSize is better
  if (d.optimalGroupSize && total >= min && total <= max) {
    const r = total % d.optimalGroupSize;
    const nearMultiple = Math.min(r, d.optimalGroupSize - r);
    const fit = 1 - nearMultiple / d.optimalGroupSize;        // 1 when divisible
    return clamp(0.7 + 0.3 * fit, 0.7, 1);
  }
  return 1;
}

function positionMatch(stats: ReturnType<typeof computeStats>, d: DrillMeta): number {
  if (!d.positionsEmphasis) return 0.5; // neutral
  const teamVec = [
    stats.guards / Math.max(1, stats.total),
    stats.forwards / Math.max(1, stats.total),
    stats.centers / Math.max(1, stats.total),
  ];
  const drillVec = [
    d.positionsEmphasis.G ?? 0,
    d.positionsEmphasis.F ?? 0,
    d.positionsEmphasis.C ?? 0,
  ];
  return cosineLike(teamVec, drillVec); // 0..1
}

function heightFit(stats: ReturnType<typeof computeStats>, d: DrillMeta): number {
  const tallTags = d.tags?.some(t => ["post","rebound","rim","seal"].includes(t.toLowerCase()));
  const guardTags = d.tags?.some(t => ["ball-handler","perimeter","closeout"].includes(t.toLowerCase()));
  if (!tallTags && !guardTags) return 0.5;

  const tall = stats.avgHeight >= 77; // ~6'5"
  const short = stats.avgHeight <= 72; // ~6'0"

  if (tall && tallTags) return 1;
  if (short && guardTags) return 1;
  if (tall && guardTags) return 0.6;
  if (short && tallTags) return 0.4;
  return 0.5;
}

function focusMatch(session: SessionContext, d: DrillMeta): number {
  if (session.focus === "balanced") return 0.6;
  return session.focus === d.focus ? 1 : 0.3;
}

function levelFit(session: SessionContext, stats: ReturnType<typeof computeStats>, d: DrillMeta): number {
  const team = session.teamLevel || stats.majorityLevel;
  const dl = d.level || "intermediate";
  if (team === dl) return 1;
  if (team === "beginner" && dl === "advanced") return 0.2;
  if (team === "advanced" && dl === "beginner") return 0.5; // acceptable as fundamentals
  return 0.7;
}
function intensityFit(session: SessionContext, remaining: number, d: DrillMeta, usedIntensities: number[]): number {
  const intensity = d.intensity ?? 3;
  const avgUsed = usedIntensities.length
    ? usedIntensities.reduce((a, b) => a + b, 0) / usedIntensities.length
    : 3;

  const expected = getExpectedIntensityForPreference(
    session.intensityPreference ?? session.teamProfile?.coachPreferences.intensityPreference,
    remaining
  );
  const spreadPenalty = clamp(Math.abs(intensity - avgUsed) / 4, 0, 1);
  const phasePenalty = clamp(Math.abs(intensity - expected) / 4, 0, 1);
  return clamp(1 - (spreadPenalty * 0.6 + phasePenalty * 0.4), 0, 1);
}

function courtFit(drill: DrillMeta, attending: number): number {
  if (!drill.requiresFullCourt) return 1;
  return attending >= 8 ? 1 : clamp(attending / 8, 0.4, 1);
}

function durationFit(remaining: number, d: DrillMeta): number {
  const target = clamp(d.duration || 10, 5, 15);
  if (target > remaining) return clamp(remaining / target, 0.2, 1);
  const buffer = remaining - target;
  return buffer <= 15 ? 1 : clamp(1 - (buffer - 15) / 30, 0.5, 1);
}

function feedbackAdj(session: SessionContext, d: DrillMeta): number {
  if (!session.feedback?.length) return 0;
  const items = session.feedback.filter(x => x.drillId === d.id);
  if (!items.length) return 0;
  const happy = items.filter(i => i.mood === "happy").length;
  const sad = items.filter(i => i.mood === "sad").length;
  return clamp((happy - sad) / 3, -0.8, 0.8); // ±0.8 max
}

function teamEffectivenessBoost(session: SessionContext, d: DrillMeta): number {
  const outcome = session.teamDrillOutcomes?.[d.id];
  if (!outcome) return 0;
  const completionScore = clamp((outcome.avgCompletionPercent ?? 0) / 100, 0, 1);
  const ratingScore = outcome.avgFeedbackRating
    ? clamp(outcome.avgFeedbackRating / 10, 0, 1)
    : 0.5;
  const combined = completionScore * 0.6 + ratingScore * 0.4;
  return clamp((combined - 0.5) * 1.2, -0.6, 0.6);
}

function recencyPenalty(session: SessionContext, d: DrillMeta): number {
  if (!session.lastUsedDrillIds?.length) return 0;
  // if this drill was in the last plan, penalize
  return session.lastUsedDrillIds.includes(d.id) ? -0.6 : 0;
}

function noveltyBonus(usedFocuses: Set<string>, d: DrillMeta): number {
  return usedFocuses.has(d.focus) ? 0 : 0.8;
}

/** Main scoring function → 0..100 */
export function scoreDrillForSession(
  session: SessionContext,
  d: DrillMeta,
  stats: ReturnType<typeof computeStats>,
  weights: Weights = DEFAULT_WEIGHTS,
  usedFocuses: Set<string> = new Set(),
  remaining: number = session.duration,
  usedIntensities: number[] = []
): number {
  const f_base = (d.rating ?? 3) / 5; // 0..1
  const f_count = playerCountFit(stats.total, d);
  const f_pos = positionMatch(stats, d);
  const f_height = heightFit(stats, d);
  const f_focus = focusMatch(session, d);
  const f_goals = textGoalMatch(session.goalsText, d);
  const f_level = levelFit(session, stats, d);
  const f_intensity = intensityFit(session, remaining, d, usedIntensities);
  const f_tags = tagsGoalMatch(session.goalsText, d);
  const f_teamProfile = teamProfileFit(session.teamProfile, d);  
  const f_court = courtFit(d, stats.total);
  const f_duration = durationFit(remaining, d);
  const f_feedback = feedbackAdj(session, d);     // -0.8..0.8
  const f_teamEffectiveness = teamEffectivenessBoost(session, d);  
  const f_recency = recencyPenalty(session, d);   // -0.6 or 0
  const f_novel = noveltyBonus(usedFocuses, d);   // 0 or 0.8

  // weighted sum; convert to 0..100
  const raw =
    f_base * weights.baseRating +
    f_count * weights.playerCountFit +
    f_pos * weights.positionMatch +
    f_height * weights.heightFit +
    f_focus * weights.focusMatch +
    f_goals * weights.goalsMatch +
    f_level * weights.levelFit +
    f_intensity * weights.intensityFit +
    f_teamProfile * weights.teamProfileFit +
    f_tags * weights.tagsMatch +
    f_court * weights.courtFit +
    f_duration * weights.durationFit +
    f_feedback * weights.feedbackBoost +
    f_teamEffectiveness * weights.teamEffectivenessBoost +    
    f_recency * weights.recencyPenalty +
    f_novel * weights.noveltyVariety;

  const weightTotal =
    weights.baseRating +
    weights.playerCountFit +
    weights.positionMatch +
    weights.heightFit +
    weights.focusMatch +
    weights.goalsMatch +
    weights.levelFit +
    weights.intensityFit +
    weights.teamProfileFit +
    weights.tagsMatch +
    weights.courtFit +
    weights.durationFit +
    weights.feedbackBoost +
    weights.teamEffectivenessBoost +
    weights.recencyPenalty +
    weights.noveltyVariety;

  return clamp(raw / weightTotal, 0, 1) * 100;
}

/** Simple grouping helper for oversubscribed drills */
export function suggestGrouping(attendingCount: number, d: DrillMeta): Array<{ size: number; label: string }> {
  const groups: Array<{ size: number; label: string }> = [];
  const og = d.optimalGroupSize || 4;

  if (attendingCount <= (d.maxPlayers ?? 999)) {
    // Try to form near-equal groups close to optimalGroupSize
    let remaining = attendingCount;
    let idx = 1;
    while (remaining > 0) {
      const size = Math.min(og, remaining);
      groups.push({ size, label: `Group ${idx++}` });
      remaining -= size;
    }
  } else {
    // If truly too big, still split into og-sized groups
    let remaining = attendingCount;
    let idx = 1;
    while (remaining > 0) {
      const size = Math.min(og, remaining);
      groups.push({ size, label: `Station ${idx++}` });
      remaining -= size;
    }
  }
  return groups;
}

/** Build a full plan with progression & constraints */
export function buildPracticePlan(
  session: SessionContext,
  drills: DrillMeta[],
  weights: Weights = DEFAULT_WEIGHTS
): PlanItem[] {
  const stats = computeStats(session.attending);
  if (stats.total < 2) return [];

  // Filter viable drills - HARD filter by minPlayers to prevent impossible selections
  const viable = drills.filter(d => 
    (d.verified !== false) && 
    (d.minPlayers ?? 1) <= stats.total
  );

  // Seed warmup/cooldown if available
  const warmups = viable.filter(d => d.tags?.includes("warmup") || d.focus === "passing");
  const cooldowns = viable.filter(d => d.tags?.includes("cooldown"));

  const usedIds = new Set<string>();
  const usedFocuses = new Set<string>();
  const usedIntensities: number[] = [];
  const plan: PlanItem[] = [];
  const drillById = new Map(drills.map(d => [d.id, d]));

  const segmentTargets = buildSegmentTargets(session.duration);
  const focusTargets = allocateFocusTargets(
    segmentTargets.main,
    normalizeFocusDistribution(session.focusDistribution)
  );
  const focusMinutes: Record<FocusArea, number> = {
    offense: 0,
    defense: 0,
    conditioning: 0,
  };
  const focusBuffer = Math.max(4, Math.round(segmentTargets.main * 0.1));
  const maxFocusMinutes: Record<FocusArea, number> = {
    offense: Math.min(segmentTargets.main, focusTargets.offense + focusBuffer),
    defense: Math.min(segmentTargets.main, focusTargets.defense + focusBuffer),
    conditioning: Math.min(segmentTargets.main, focusTargets.conditioning + focusBuffer),
  };

  
  const primaryArea = session.focus === "balanced" ? null : mapFocusToArea(session.focus);
  const minPrimaryMinutes = primaryArea
    ? Math.max(Math.round(segmentTargets.main * 0.3), focusTargets[primaryArea])
    : 0;

  const resolveDuration = (desired: number, remainingMinutes: number) => {
    if (remainingMinutes <= 0) return 0;
    const minDuration = remainingMinutes < 5 ? Math.max(1, remainingMinutes) : 5;
    return Math.min(remainingMinutes, clamp(desired, minDuration, 15));
  };

  const canTakeFocus = (focusArea: FocusArea, duration: number, allowOverMax = false) => {
    if (duration <= 0) return false;
    if (plan.length && primaryArea && focusMinutes[primaryArea] < minPrimaryMinutes && focusArea !== primaryArea) {
      return false;
    }
    if (focusMinutes[focusArea] + duration > maxFocusMinutes[focusArea]) {
      return allowOverMax;
    }
    return true;
  };

  const take = (d: DrillMeta, minutes: number, segment: SegmentType) => {
    const dur = Math.round(minutes);
    if (dur <= 0) return false;
    usedIds.add(d.id);
    usedFocuses.add(d.focus);
    usedIntensities.push(d.intensity ?? 3);
    const groups = suggestGrouping(stats.total, d);
    const explainWhy = buildExplainWhy(session, d);    
    plan.push({
      drillId: d.id,
      duration: dur,
      notes: groups.length > 1 ? `${groups.length} groups; ${groups.map(g=>g.size).join("-")} players` : undefined,
      groups,
      segment,
      explainWhy,
    });
    if (segment === "main") {
      const focusArea = mapFocusToArea(d.focus);
      focusMinutes[focusArea] += dur;
    }    
    return true;
  };

  const pickBest = (
    pool: DrillMeta[],
    remainingMinutes: number,
    options: { lastFocus?: string; segment: SegmentType; allowOverMax?: boolean; focusFilter?: FocusArea }
  ) => {
  const scored = pool
      .filter(d => !usedIds.has(d.id))
      .filter(d => !options.focusFilter || mapFocusToArea(d.focus) === options.focusFilter)    
      .map(d => ({
        d,
        s: scoreDrillForSession(session, d, stats, weights, usedFocuses, remainingMinutes, usedIntensities),
      }))
      .sort((a, b) => b.s - a.s);
    for (const { d } of scored) {
      if (plan.length && options.lastFocus && d.focus === options.lastFocus && scored.length > 3) continue;
      if ((d.minPlayers ?? 1) > stats.total) continue;
      const desired = resolveDuration(d.duration || 10, remainingMinutes);
      if (options.segment === "main") {
        const focusArea = mapFocusToArea(d.focus);
        if (!canTakeFocus(focusArea, desired, options.allowOverMax)) continue;
      }
      return d;
    }
    return undefined;
  };

  const reconcileSegment = (
    segment: SegmentType,
    startIndex: number,
    targetMinutes: number,
    pool: DrillMeta[]
  ) => {
    const segmentItems = plan.slice(startIndex);
    const currentDuration = segmentItems.reduce((sum, item) => sum + item.duration, 0);
    let delta = targetMinutes - currentDuration;
    if (!segmentItems.length) return;

    const updateFocus = (item: PlanItem, adjustment: number) => {
      if (segment !== "main") return;
      const drill = drillById.get(item.drillId);
      if (!drill) return;
      const focusArea = mapFocusToArea(drill.focus);
      focusMinutes[focusArea] += adjustment;
    };

    while (delta < 0 && segmentItems.length) {
      const last = segmentItems[segmentItems.length - 1];
      const trim = Math.min(last.duration - 5, -delta);
      if (trim > 0) {
        last.duration -= trim;
        updateFocus(last, -trim);
        delta += trim;
      } else {
        segmentItems.pop();
        plan.pop();
        updateFocus(last, -last.duration);
        delta += last.duration;
      }
    }

    if (delta > 0 && segmentItems.length) {
      const last = segmentItems[segmentItems.length - 1];
      const extend = Math.min(15 - last.duration, delta);
      if (extend > 0) {
        last.duration += extend;
        updateFocus(last, extend);
        delta -= extend;
      }
    }

    while (delta >= 5) {
      const lastFocus = plan.at(-1)
        ? (drillById.get(plan.at(-1)!.drillId)?.focus)
        : undefined;
      const pick = pickBest(pool, delta, { lastFocus, segment, allowOverMax: true });
      if (!pick) break;
      const duration = resolveDuration(pick.duration || 10, delta);
      take(pick, duration, segment);
      delta -= duration;
    }

    if (delta > 0 && segmentItems.length) {
      const last = segmentItems[segmentItems.length - 1];
      last.duration += delta;
      updateFocus(last, delta);
    }
  };

  const planSegment = (segment: SegmentType, targetMinutes: number, pool: DrillMeta[]) => {
    const startIndex = plan.length;
    let remaining = targetMinutes;
    let safety = 20;
    while (remaining >= 5 && safety-- > 0) {
      const lastFocus = plan.at(-1) ? (drillById.get(plan.at(-1)!.drillId)?.focus) : undefined;
      const focusFilter =
        segment === "main" && primaryArea && focusMinutes[primaryArea] < minPrimaryMinutes
          ? primaryArea
          : undefined;
      const best = pickBest(pool, remaining, { lastFocus, segment, focusFilter });
      if (!best) {
        if (focusFilter) {
          const relaxed = pickBest(pool, remaining, { lastFocus, segment, allowOverMax: true });
          if (!relaxed) break;
          const duration = resolveDuration(relaxed.duration || 10, remaining);
          take(relaxed, duration, segment);
          remaining -= duration;
          continue;
        }
        break;
      }
      const duration = resolveDuration(best.duration || 10, remaining);
      take(best, duration, segment);
      remaining -= duration;
    }
    reconcileSegment(segment, startIndex, targetMinutes, pool);
  };

  const warmupPool = warmups.length ? warmups : viable;
  const cooldownPool = cooldowns.length ? cooldowns : viable;

  planSegment("warmup", segmentTargets.warmup, warmupPool);

  planSegment("main", segmentTargets.main, viable);

  planSegment("cooldown", segmentTargets.cooldown, cooldownPool);

  return plan;
}
