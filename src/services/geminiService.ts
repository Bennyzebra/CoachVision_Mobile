import { supabase } from "../integrations/supabase/client";
import type { TeamProfileSummary } from "@/lib/planning/teamProfile";
import type { IntensityPreference } from "@/types";
import { createGeminiFunctionCaller } from "./geminiFunctionClient";
import type { GeminiAction, GeminiFunctionCallOptions } from "./geminiFunctionClient";

export const callGeminiFunction = createGeminiFunctionCaller(
  supabase.functions.invoke.bind(supabase.functions)
);

export type { GeminiAction };

export type PracticeIntent = {
  focus: string[];
  goals: string;
  duration?: number;
};

export type PlanningIntent = {
  primary_focus: string;
  secondary_focuses: string[];
  suggested_goals: string;
  drill_keywords: string[];
};

export interface CoachRequirements {
  ageGroup: string;
  focus: string;
  duration: number;
  goals?: string;
  intensityPreference?: IntensityPreference;
  preferredDrillIds?: string[];
  coachId?: string;
  teamId?: string;
}

export interface DrillData {
  id: string;
  name: string;
  category?: string;
  duration_min?: number;
  duration?: number;
  intensity?: number;
  focus_tags?: string[];
  [key: string]: unknown;
}

export async function parseSearchIntent(searchText: string): Promise<PracticeIntent> {
  try {
    return await callGeminiFunction<PracticeIntent>("parseSearchIntent", { searchText });
  } catch (error) {
    console.error("Error parsing search intent with Gemini:", error);
    throw error;
  }
}

export async function generatePracticePlan(
  coachRequirements: CoachRequirements,
  availableDrills: DrillData[],
  preferredDrillIds?: string[],
  options: GeminiFunctionCallOptions = {}
) {
  try {
    if (!availableDrills || availableDrills.length === 0) {
      throw new Error("No drills available. Please add drills to your library first.");
    }

    return await callGeminiFunction("generatePracticePlan", {
      coachRequirements,
      availableDrills,
      preferredDrillIds,
    }, options);
  } catch (error) {
    console.error("Error in generatePracticePlan:", error);
    throw error;
  }
}

export async function generateDrillExplainWhys(params: {
  coachRequirements: CoachRequirements;
  teamProfileSummary?: TeamProfileSummary | null;
  drills: Array<{
    id: string;
    name: string;
    focus?: string;
    duration?: number;
    segment?: string;
    tags?: string[];
  }>;
}, options: GeminiFunctionCallOptions = {}): Promise<Record<string, string>> {
  if (!params.drills.length) return {};

  try {
    return await callGeminiFunction<Record<string, string>>(
      "generateDrillExplainWhys",
      params,
      options
    );
  } catch (error) {
    console.error("Error generating drill explain-why text:", error);
    return {};
  }
}

export async function summarizeIntentForPlanning(searchText: string): Promise<PlanningIntent> {
  try {
    return await callGeminiFunction<PlanningIntent>("summarizeIntentForPlanning", { searchText });
  } catch (error) {
    console.error("Error summarizing intent for planning:", error);
    throw error;
  }
}
