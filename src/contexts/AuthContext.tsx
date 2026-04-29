import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Profile {
  id: string;
  coach_name: string;
  email: string | null;
  organization?: string | null;  
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
    updateProfile: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const ensureProfilesExist = async (userId: string, userEmail: string | undefined) => {
      try {
                // 1) Ensure a row exists in profiles
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();

        let profileRow = existingProfile;

        if (!existingProfile) {
          const { data: insertedProfile, error: insertProfileError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: userEmail ?? null,
              coach_name: "Coach",
            })
            .select("*")
            .single();

          if (insertProfileError) {
            console.error("Error inserting profile:", insertProfileError);
            return;
          }

          profileRow = insertedProfile;
        }

        // 2) Ensure a row exists in coach_profiles and capture org info
        const { data: existingCoachProfile } = await supabase
          .from("coach_profiles")
          .select("id, coach_name, email, organization")
          .eq("id", userId)
          .maybeSingle();

        let coachProfileRow = existingCoachProfile;
        
        if (!existingCoachProfile) {
          const { data: insertedCoachProfile, error: insertCoachError } = await supabase
            .from("coach_profiles")
            .insert({
               id: userId,
              email: userEmail ?? null,
              coach_name: profileRow?.coach_name ?? "Coach",
            })
            .select("id, coach_name, email, organization")
            .single();
        
          if (insertCoachError) {
            console.error("Error inserting coach_profile:", insertCoachError);
          }

          coachProfileRow = insertedCoachProfile ?? null;
        }

        const organization = coachProfileRow?.organization ?? (coachProfileRow as { org?: string | null } | null)?.org ?? null;
                if (profileRow) {
          setProfile({
            id: profileRow.id,
            coach_name: profileRow.coach_name ?? "Coach",
            email: profileRow.email ?? null,
            organization,
          });          
        }
      } catch (error) {
        console.error("Error ensuring profiles exist:", error);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          setSession(session);
          setUser(session?.user ?? null);

          if (event === "PASSWORD_RECOVERY") {
            navigate("/reset-password");
          }
          
          if (session?.user) {
            await ensureProfilesExist(session.user.id, session.user.email);
          } else {
            setProfile(null);
          }

          setLoading(false);
        })();
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      (async () => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await ensureProfilesExist(session.user.id, session.user.email);
        }

        setLoading(false);
      })();
    });

    return () => subscription.unsubscribe();
  }, [navigate]);
    
    const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;

    const filteredUpdates: Partial<Profile> = Object.fromEntries(
      Object.entries(updates).filter(([, value]) => value !== undefined)
    );

    const { organization, ...profileUpdates } = filteredUpdates;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ ...profileUpdates })
        .eq("id", user.id);

      if (profileError) {
        console.error("Error updating profile:", profileError);
        return;
      } 
    }

    if (organization !== undefined || filteredUpdates.coach_name || filteredUpdates.email) {
      const { error: coachProfileError } = await supabase
        .from("coach_profiles")
        .update({
          coach_name: filteredUpdates.coach_name,
          email: filteredUpdates.email,
          organization,          
        })
          .eq("id", user.id);    
      if (coachProfileError) {
        console.error("Error updating coach profile:", coachProfileError);
      }
    }

    setProfile((prev) => {
      if (prev) return { ...prev, ...filteredUpdates } as Profile;

      return {
        id: user.id,
        coach_name: filteredUpdates.coach_name || "Coach",
        email: filteredUpdates.email ?? null,
        organization: organization ?? null,        
      };
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, updateProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
