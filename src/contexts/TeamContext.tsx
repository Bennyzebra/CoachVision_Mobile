import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface Team {
  id: string;
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
  profile: Profile | null;
  setCurrentTeam: (team: Team | null) => void;
  refreshTeams: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const TeamContext = createContext<TeamContextType>({
  currentTeam: null,
  teams: [],
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
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    
    if (data) setProfile(data);
  };

  const refreshTeams = async () => {
    if (!user) return;

    const { data } = await supabase
      .from("teams")
      .select("*")
      .eq("coach_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      setTeams(data);
      // Auto-select first team if none selected
      if (!currentTeam && data.length > 0) {
        setCurrentTeam(data[0]);
      }
    }
  };

  useEffect(() => {
    if (user) {
      refreshProfile();
      refreshTeams();
    } else {
      setCurrentTeam(null);
      setTeams([]);
      setProfile(null);
    }
  }, [user]);

  return (
    <TeamContext.Provider 
      value={{ 
        currentTeam, 
        teams, 
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
