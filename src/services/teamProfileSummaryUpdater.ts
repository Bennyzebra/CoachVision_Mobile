import {
  extractFeedbackInsights,
  mergeTeamProfileSummary,
  summarizePlanThemes,
  type PracticePlanSummary,
  type TeamProfileSummary,
} from "../lib/planning/teamProfile.ts";
import { isMissingTeamProfileSummaryColumnError } from "./teamProfileSummaryErrors.ts";

export type TeamProfileSummaryRepository = {
  fetch: (teamId: string) => Promise<{ data: TeamProfileSummary | null | undefined; error: unknown }>;
  update: (teamId: string, summary: TeamProfileSummary) => Promise<{ error: unknown }>;
};

export const createTeamProfileSummaryUpdater = (repository: TeamProfileSummaryRepository) => {
  let summaryColumnUnavailable = false;

  const fetchTeamProfileSummary = async (teamId: string): Promise<TeamProfileSummary | null> => {
    if (summaryColumnUnavailable) return null;

    const { data, error } = await repository.fetch(teamId);
    if (error) {
      if (isMissingTeamProfileSummaryColumnError(error)) {
        summaryColumnUnavailable = true;
        return null;
      }

      throw error;
    }

    return data ?? null;
  };

  const updateTeamProfileSummary = async (teamId: string, nextSummary: TeamProfileSummary) => {
    if (summaryColumnUnavailable) return;

    const { error } = await repository.update(teamId, nextSummary);
    if (error) {
      if (isMissingTeamProfileSummaryColumnError(error)) {
        summaryColumnUnavailable = true;
        return;
      }

      throw error;
    }
  };

  const updateFromPracticePlan = async (teamId: string, plan: PracticePlanSummary) => {
    const currentSummary = await fetchTeamProfileSummary(teamId);
    if (summaryColumnUnavailable) return;

    const { tagWeights, recentThemes } = summarizePlanThemes(plan);
    const nextSummary = mergeTeamProfileSummary(currentSummary, {
      tagWeights,
      recentThemes,
    });

    await updateTeamProfileSummary(teamId, nextSummary);
  };

  const updateFromFeedback = async (teamId: string, feedbackNotes: string) => {
    const trimmed = feedbackNotes.trim();
    if (!trimmed) return;

    const currentSummary = await fetchTeamProfileSummary(teamId);
    if (summaryColumnUnavailable) return;

    const insights = extractFeedbackInsights(trimmed);
    const nextSummary = mergeTeamProfileSummary(currentSummary, {
      strengths: insights.strengths,
      weaknesses: insights.weaknesses,
      tagWeights: insights.tagWeights,
    });

    await updateTeamProfileSummary(teamId, nextSummary);
  };

  return {
    fetchTeamProfileSummary,
    updateFromPracticePlan,
    updateFromFeedback,
  };
};
