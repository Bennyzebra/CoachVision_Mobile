import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Team {
  id: string;
  coach_id: string;
  team_name: string;
  sport: string;
  organization: string | null;
  logo_url: string | null;
  team_profile_summary?: unknown;  
}

interface Profile {
  id: string;
  coach_name: string;
  email: string | null;
}

interface TeamContextType {
  currentTeam: Team | null;
  teams: Team[];
  teamsLoading: boolean;
  teamsError: string | null;
  profile: Profile | null;
  setCurrentTeam: (team: Team | null) => void;
  refreshTeams: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  currentTeam: null,
  teams: [],
  teamsLoading: false,
  teamsError: null,
  profile: null,
  setCurrentTeam: () => {},
  refreshTeams: async () => {},
  refreshProfile: async () => {},
});

export const useTeam = () => useContext(TeamContext);

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsQueryLoading, setTeamsQueryLoading] = useState(false);
  const [teamsLoadedForUserId, setTeamsLoadedForUserId] = useState<string | null>(null);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) setProfile(data);
  }, [user]);

  const refreshTeams = useCallback(async () => {
    if (!user) return;

    setTeamsQueryLoading(true);
    setTeamsError(null);

    try {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("coach_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const nextTeams = data ?? [];
      setTeams(nextTeams);
      setCurrentTeam((selectedTeam) => {
        if (!selectedTeam) return nextTeams[0] ?? null;
        return nextTeams.find((team) => team.id === selectedTeam.id) ?? nextTeams[0] ?? null;
      });
    } catch (error) {
      setTeamsError(error instanceof Error ? error.message : "Unable to load your teams.");
    } finally {
      setTeamsLoadedForUserId(user.id);
      setTeamsQueryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshProfile();
      refreshTeams();
    } else {
      setCurrentTeam(null);
      setTeams([]);
      setTeamsQueryLoading(false);
      setTeamsLoadedForUserId(null);
      setTeamsError(null);
      setProfile(null);
    }
  }, [refreshProfile, refreshTeams, user]);

  const teamsLoading = Boolean(user) && (teamsQueryLoading || teamsLoadedForUserId !== user.id);

  return (
    <TeamContext.Provider 
      value={{ 
        currentTeam, 
        teams, 
        teamsLoading,
        teamsError,
        profile,
        setCurrentTeam, 
        refreshTeams,
        refreshProfile
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};
