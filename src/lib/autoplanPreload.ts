import { supabase } from "@/integrations/supabase/client";
import { Drill, DrillFocus, Experience, Position } from "@/types";
import type { SessionContext } from "@/lib/planning/engine";

type TeamPlayers = SessionContext["attending"];
type DrillRow = Record<string, unknown>;

const asString = (value: unknown, fallback = "") => (typeof value === "string" ? value : fallback);
const asNumber = (value: unknown, fallback: number | undefined = undefined) =>
  typeof value === "number" ? value : fallback;
const asBoolean = (value: unknown, fallback: boolean | undefined = undefined) =>
  typeof value === "boolean" ? value : fallback;
const asStringArray = (value: unknown) => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
const asDrillFocus = (value: unknown): DrillFocus =>
  value === "defense" || value === "passing" || value === "conditioning" ? value : "offense";
const asExperience = (value: unknown): Experience | undefined =>
  value === "beginner" || value === "intermediate" || value === "advanced" ? value : undefined;
const asPosition = (value: unknown): Position => (value === "F" || value === "C" ? value : "G");
const asPositionEmphasis = (value: unknown): Partial<Record<Position, number>> | undefined =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Partial<Record<Position, number>>)
    : undefined;

let drillsCache: Drill[] | null = null;
let drillsPromise: Promise<Drill[]> | null = null;
const playersCache = new Map<string, TeamPlayers>();
const playersPromise = new Map<string, Promise<TeamPlayers>>();

const mapDrills = (drills: DrillRow[]): Drill[] =>
  drills.map((d) => ({
    id: asString(d.id),
    name: asString(d.name),
    focus: asDrillFocus(d.focus || d.category),
    duration: asNumber(d.duration || d.duration_min, 10) ?? 10,
    rating: asNumber(d.rating, 0) ?? 0,
    verified: asBoolean(d.verified, false),
    description: asString(d.description),
    cues: asStringArray(d.cues),
    tags: asStringArray(d.focus_tags).length ? asStringArray(d.focus_tags) : asStringArray(d.tags),
    mediaUrl: asString(d.media_url, undefined),
    minPlayers: asNumber(d.min_players),
    maxPlayers: asNumber(d.max_players),
    optimalGroupSize: asNumber(d.optimal_group_size),
    level: asExperience(d.level),
    intensity: asNumber(d.intensity) as Drill["intensity"],
    positionsEmphasis: asPositionEmphasis(d.positions_emphasis),
    requiresFullCourt: asBoolean(d.requires_full_court),
  }));

const fetchAllDrills = async (): Promise<Drill[]> => {
  if (drillsCache) return drillsCache;
  if (drillsPromise) return drillsPromise;

  drillsPromise = supabase
    .from("drills")
    .select("*")
    .then(({ data, error }) => {
      if (error || !data) {
        return [];
      }
      const mapped = mapDrills(data);
      drillsCache = mapped;
      return mapped;
    })
    .finally(() => {
      drillsPromise = null;
    });

  return drillsPromise;
};

const fetchTeamPlayers = async (teamId: string): Promise<TeamPlayers> => {
  if (playersCache.has(teamId)) return playersCache.get(teamId) ?? [];
  if (playersPromise.has(teamId)) return playersPromise.get(teamId) ?? Promise.resolve([]);

  const request = supabase
    .from("players")
    .select("*")
    .eq("team_id", teamId)
    .then(({ data }) => {
      if (!data) return [];
      const normalized: TeamPlayers = data.map((p) => ({
        id: p.id,
        name: p.name,
        position: asPosition(p.position),
        number: 0,
        height: p.height,
        experience: asExperience(p.experience),
      }));
      playersCache.set(teamId, normalized);
      return normalized;
    })
    .finally(() => {
      playersPromise.delete(teamId);
    });

  playersPromise.set(teamId, request);
  return request;
};

export const preloadAutoPlanData = (teamId?: string | null) => {
  void fetchAllDrills();
  if (teamId) {
    void fetchTeamPlayers(teamId);
  }
};

export const getPreloadedDrills = () => drillsCache;

export const getPreloadedPlayers = (teamId: string) => playersCache.get(teamId);

export const loadAutoPlanDrills = fetchAllDrills;

export const loadAutoPlanPlayers = fetchTeamPlayers;
