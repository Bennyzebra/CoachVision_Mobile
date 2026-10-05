import { supabase } from "@/integrations/supabase/client";
import { Drill } from "@/types";
import type { SessionContext } from "@/lib/planning/engine";

type TeamPlayers = SessionContext["attending"];

let drillsCache: Drill[] | null = null;
let drillsPromise: Promise<Drill[]> | null = null;
const playersCache = new Map<string, TeamPlayers>();
const playersPromise = new Map<string, Promise<TeamPlayers>>();

type DrillRow = Record<string, unknown>;

const mapDrills = (drills: DrillRow[]): Drill[] =>
  drills.map((d) => ({
    id: d.id as string,
    name: d.name as string,
    focus: (d.focus ?? d.category ?? "offense") as Drill["focus"],
    duration: Number(d.duration ?? d.duration_min ?? 10),
    rating: Number(d.rating ?? 0),
    verified: Boolean(d.verified),
    description: (d.description as string | undefined) ?? "",
    cues: (d.cues as string[] | undefined) ?? [],
    tags: (d.focus_tags as string[] | undefined) ?? (d.tags as string[] | undefined) ?? [],
    mediaUrl: d.media_url as string | undefined,
    minPlayers: d.min_players as number | undefined,
    maxPlayers: d.max_players as number | undefined,
    optimalGroupSize: d.optimal_group_size as number | undefined,
    level: d.level as Drill["level"],
    intensity: d.intensity as Drill["intensity"],
    positionsEmphasis: d.positions_emphasis as Drill["positionsEmphasis"],
    requiresFullCourt: d.requires_full_court as boolean | undefined,
  }));

const fetchAllDrills = async (): Promise<Drill[]> => {
  if (drillsCache) return drillsCache;
  if (drillsPromise) return drillsPromise;

  drillsPromise = Promise.resolve(
    supabase.from("drills").select("*").then(({ data, error }) => {
      if (error || !data) {
        return [];
      }
      const mapped = mapDrills(data as unknown as DrillRow[]);
      drillsCache = mapped;
      return mapped;
    })
  )
    .finally(() => {
      drillsPromise = null;
    });

  return drillsPromise;
};

const fetchTeamPlayers = async (teamId: string): Promise<TeamPlayers> => {
  if (playersCache.has(teamId)) return playersCache.get(teamId) ?? [];
  if (playersPromise.has(teamId)) return playersPromise.get(teamId) ?? Promise.resolve([]);

  const request = Promise.resolve(
    supabase.from("players").select("*").eq("team_id", teamId).then(({ data }) => {
      if (!data) return [];
      const normalized: TeamPlayers = data.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position as "G" | "F" | "C",
        number: 0,
        height: p.height,
        experience: p.experience as "beginner" | "intermediate" | "advanced",
      }));
      playersCache.set(teamId, normalized);
      return normalized;
    })
  )
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
