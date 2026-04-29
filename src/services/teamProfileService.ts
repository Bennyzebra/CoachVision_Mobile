import { supabase } from "@/integrations/supabase/client";
import {
  extractFeedbackInsights,
  mergeTeamProfileSummary,
  summarizePlanThemes,
  type PracticePlanSummary,
  type TeamProfileSummary,
} from "@/lib/planning/teamProfile";

const fetchTeamProfileSummary = async (teamId: string) => {
  const { data, error } = await supabase
    .from("teams")
    .select("team_profile_summary")
    .eq("id", teamId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.team_profile_summary as TeamProfileSummary | null | undefined) ?? null;
};

export const updateTeamProfileFromPracticePlan = async (teamId: string, plan: PracticePlanSummary) => {
  const currentSummary = await fetchTeamProfileSummary(teamId);
  const { tagWeights, recentThemes } = summarizePlanThemes(plan);
  const nextSummary = mergeTeamProfileSummary(currentSummary, {
    tagWeights,
    recentThemes,
  });

  const { error } = await supabase
    .from("teams")
    .update({ team_profile_summary: nextSummary })
    .eq("id", teamId);

  if (error) {
    throw error;
  }
};

export const updateTeamProfileFromFeedback = async (teamId: string, feedbackNotes: string) => {
  const trimmed = feedbackNotes.trim();
  if (!trimmed) return;

  const currentSummary = await fetchTeamProfileSummary(teamId);
  const insights = extractFeedbackInsights(trimmed);
  const nextSummary = mergeTeamProfileSummary(currentSummary, {
    strengths: insights.strengths,
    weaknesses: insights.weaknesses,
    tagWeights: insights.tagWeights,
  });

  const { error } = await supabase
    .from("teams")
    .update({ team_profile_summary: nextSummary })
    .eq("id", teamId);

  if (error) {
    throw error;
  }
};