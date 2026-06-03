import { supabase } from "@/integrations/supabase/client";
import type { PracticePlanSummary, TeamProfileSummary } from "@/lib/planning/teamProfile";
import { createTeamProfileSummaryUpdater } from "./teamProfileSummaryUpdater";

const teamProfileSummaryUpdater = createTeamProfileSummaryUpdater({
  fetch: async (teamId: string) => {
    const { data, error } = await supabase
      .from("teams")
      .select("team_profile_summary")
      .eq("id", teamId)
      .maybeSingle();

    return {
      data: (data?.team_profile_summary as TeamProfileSummary | null | undefined) ?? null,
      error,
    };
  },
  update: async (teamId: string, summary: TeamProfileSummary) => {
    const { error } = await supabase
      .from("teams")
      .update({ team_profile_summary: summary })
      .eq("id", teamId);

    return { error };
  },
});

export const updateTeamProfileFromPracticePlan = async (teamId: string, plan: PracticePlanSummary) => {
  await teamProfileSummaryUpdater.updateFromPracticePlan(teamId, plan);
};

export const updateTeamProfileFromFeedback = async (teamId: string, feedbackNotes: string) => {
  await teamProfileSummaryUpdater.updateFromFeedback(teamId, feedbackNotes);
};
