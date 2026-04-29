import { supabase } from "@/integrations/supabase/client";
import { Drill } from "@/types";
import type { SessionContext } from "@/lib/planning/engine";

type TeamPlayers = SessionContext["attending"];

let drillsCache: Drill[] | null = null;
let drillsPromise: Promise<Drill[]> | null = null;
const playersCache = new Map<string, TeamPlayers>();
const playersPromise = new Map<string, Promise<TeamPlayers>>();

const mapDrills = (drills: Array<Record<string, any>>): Drill[] =>
  drills.map((d) => ({
    id: d.id,
    name: d.name,
    focus: d.focus || d.category || "offense",
    duration: d.duration || d.duration_min || 10,
    rating: d.rating || 0,
    verified: d.verified || false,
    description: d.description || "",
    cues: d.cues || [],
    tags: d.focus_tags || d.tags || [],
    mediaUrl: d.media_url,
    minPlayers: d.min_players,
    maxPlayers: d.max_players,
    optimalGroupSize: d.optimal_group_size,
    level: d.level,
    intensity: d.intensity,
    positionsEmphasis: d.positions_emphasis,
    requiresFullCourt: d.requires_full_court,
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
        position: p.position as "G" | "F" | "C",
        number: 0,
        height: p.height,
        experience: p.experience as "beginner" | "intermediate" | "advanced",
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