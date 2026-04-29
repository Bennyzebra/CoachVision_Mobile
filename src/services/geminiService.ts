import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "../integrations/supabase/client";
import type { TeamProfileSummary } from "@/lib/planning/teamProfile";

const getGenAIClient = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY for Gemini requests.");
  }
  return new GoogleGenerativeAI(apiKey);
};
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

export interface DrillOutcomeSummary {
  drill_id: string;
  total_sessions: number;
  total_completed: number;
  avg_completion_percent: number;
  avg_feedback_rating: number;
  last_feedback_notes: string | null;
}

export async function parseSearchIntent(searchText: string): Promise<PracticeIntent> {
  try {
    const model = getGenAIClient().getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are helping a basketball coach quickly set up a practice session.
Input: "${searchText}"

Extract the coach's intent as JSON with the following shape:
{
  "focus": string[] // focus areas using these allowed values: offense, defense, conditioning, passing, shooting, ball-movement
  "goals": string   // concise practice goal or summary of needs
  "duration": number // optional duration in minutes if mentioned
}

Rules:
- Return ONLY valid JSON, no markdown or explanations.
- If you aren't confident about a field, omit it rather than guessing.
- Keep goals short and actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed || !Array.isArray(parsed.focus) || typeof parsed.goals !== "string") {
      throw new Error("Invalid intent response format from Gemini");
    }

    return parsed;
  } catch (error) {
    console.error("Error parsing search intent with Gemini:", error);
    throw error;
  }
}

export async function generatePracticePlan(coachRequirements: CoachRequirements, availableDrills: DrillData[], preferredDrillIds?: string[]) {
  try {
    if (!availableDrills || availableDrills.length === 0) {
      throw new Error("No drills available. Please add drills to your library first.");
    }


    const model = getGenAIClient().getGenerativeModel({ model: "gemini-2.5-flash" });    
    const { data: practiceHistory, error: historyError } = await supabase
      .from('practices')
      .select('feedback_notes, feedback_rating, completed_at')
      .not('feedback_notes', 'is', null)
      .order('completed_at', { ascending: false });

    if (historyError) {
      console.warn("Could not fetch practice history:", historyError);
    }

    let memoryContext = "";
    if (practiceHistory && practiceHistory.length > 0) {
      const recentFeedback = practiceHistory.slice(0, 5);
      const feedbackThemes = new Set<string>();
      const addTheme = (theme: string) => {
        feedbackThemes.add(theme);
      };

      recentFeedback.forEach(({ feedback_notes }) => {
        const normalized = (feedback_notes ?? "").toLowerCase();
        if (!normalized) {
          return;
        }
        if (/(boring|monotonous|repetitive|same drills|same drill)/.test(normalized)) {
          addTheme("Increase variety across drills and activities.");
          return;
        }
        if (/(too easy|not challenging|too basic)/.test(normalized)) {
          addTheme("Raise difficulty and competitive intensity.");
          return;
        }
        if (/(too hard|too intense|fatiguing|exhausting)/.test(normalized)) {
          addTheme("Balance intensity with recovery.");
          return;
        }
        if (/(unclear|confusing|instructions|explain)/.test(normalized)) {
          addTheme("Provide clearer instructions and demonstrations.");
          return;
        }
        if (/(too long|ran long|over time|time management)/.test(normalized)) {
          addTheme("Tighten timing and keep segments on schedule.");
          return;
        }
        if (/(too short|rushed|not enough time)/.test(normalized)) {
          addTheme("Allow adequate time for key drills.");
          return;
        }
        if (/(warmup|cool down|cooldown)/.test(normalized)) {
          addTheme("Improve warmup and cool down structure.");
          return;
        }
        addTheme("Address additional coach feedback about practice structure and pacing.");
      });

      if (feedbackThemes.size > 0) {
        memoryContext = `
    PAST FEEDBACK THEMES (use as constraints, do not quote directly):
    ${Array.from(feedbackThemes).map(theme => `- ${theme}`).join('\n')}
    `;
      }        
    }

    let drillOutcomeContext = "";
    if (coachRequirements.coachId && coachRequirements.teamId) {
      const { data: drillOutcomes, error: outcomesError } = await supabase
        .from("practice_drill_outcomes")
        .select(
          "drill_id, total_sessions, total_completed, avg_completion_percent, avg_feedback_rating, last_feedback_notes"
        )
        .eq("coach_id", coachRequirements.coachId)
        .eq("team_id", coachRequirements.teamId)
        .order("total_sessions", { ascending: false })
        .limit(20);

      if (outcomesError) {
        console.warn("Could not fetch drill outcomes:", outcomesError);
      } else if (drillOutcomes && drillOutcomes.length > 0) {
        const drillNameMap = new Map(availableDrills.map((drill) => [drill.id, drill.name]));
        const sortedByCompletion = [...drillOutcomes].sort(
          (a, b) => (b.avg_completion_percent ?? 0) - (a.avg_completion_percent ?? 0)
        );
        const strongest = sortedByCompletion.slice(0, 3);
        const weakest = sortedByCompletion.slice(-3).reverse();

        const formatOutcome = (outcome: DrillOutcomeSummary) => {
          const name = drillNameMap.get(outcome.drill_id) || outcome.drill_id;
          const completion = Math.round(outcome.avg_completion_percent ?? 0);
          const rating = outcome.avg_feedback_rating ? `${outcome.avg_feedback_rating.toFixed(1)}/10` : "n/a";
          return `- ${name} (avg completion ${completion}%, rating ${rating}, ${outcome.total_sessions} sessions)`;
        };

        drillOutcomeContext = `
TEAM DRILL OUTCOMES (use for variety + effectiveness, do not quote directly):
High-performing drills:
${strongest.map(formatOutcome).join("\n")}
Needs improvement:
${weakest.map(formatOutcome).join("\n")}
`;
      }
    }

    
    // Build preferred drills context if any are pinned
    let preferredDrillsContext = "";
    if (preferredDrillIds && preferredDrillIds.length > 0) {
      const preferredDrills = availableDrills.filter(d => preferredDrillIds.includes(d.id));
      if (preferredDrills.length > 0) {
        preferredDrillsContext = `
    PREFERRED DRILLS (Coach has specifically pinned these - PRIORITIZE including them):
    ${preferredDrills.map(d => `- ${d.name} (ID: ${d.id}, Duration: ${d.duration_min}min)`).join('\n')}
    These drills should be strongly favored in the plan when they fit the focus and time constraints.
    `;
      }
    }    
    const drillListString = JSON.stringify(availableDrills.map(d => ({
      id: d.id,
      name: d.name,
      category: d.category,
      duration_min: d.duration_min,
      intensity: d.intensity,
      focus_tags: d.focus_tags
    })));

    const prompt = `You are an expert basketball coach creating a practice plan.
${memoryContext}
${drillOutcomeContext}
${preferredDrillsContext}

CONTEXT:
- Age/Experience Level: ${coachRequirements.ageGroup}
- Primary Focus: ${coachRequirements.focus}
- Total Duration: ${coachRequirements.duration} minutes
- Goals: ${coachRequirements.goals || "General skill development"}

AVAILABLE DRILLS:
${drillListString}

INSTRUCTIONS:
1. Select drills from the list above that fit the time and focus
2. Allocate approximately 15% for warmup, 70% for main segment, 15% for cool down
3. Each drill object must include the exact id, name, category, duration_min, and other fields from the list
4. Return ONLY valid JSON with NO markdown formatting
5. Do not reference past feedback or "to address feedback" in coach_notes; describe the plan's strategy plainly.
${preferredDrillIds && preferredDrillIds.length > 0 ? "6. IMPORTANT: Prioritize including the preferred/pinned drills in the main segment if they fit the criteria" : ""}
Required JSON structure:
{
  "warmup": [drill_objects_from_list],
  "main_segment": [drill_objects_from_list],
  "cool_down": [drill_objects_from_list],
  "coach_notes": "Brief explanation of the plan strategy"
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.warmup || !parsed.main_segment || !parsed.cool_down) {
      throw new Error("Invalid response format from AI");
    }

    return parsed;
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
}): Promise<Record<string, string>> {
  if (!params.drills.length) return {};

  try {
    const model = getGenAIClient().getGenerativeModel({ model: "gemini-2.5-flash" });
    const profileSummary = params.teamProfileSummary
      ? {
          strengths: params.teamProfileSummary.strengths,
          weaknesses: params.teamProfileSummary.weaknesses,
          recentThemes: params.teamProfileSummary.recentThemes,
        }
      : "None available";

    const drillsPayload = params.drills.map((drill) => ({
      id: drill.id,
      name: drill.name,
      focus: drill.focus,
      segment: drill.segment,
      duration: drill.duration,
      tags: drill.tags,
    }));

    const prompt = `You are an expert basketball coach. Write a single-sentence "why this drill" explanation for each drill.

Context:
- Age/Experience Level: ${params.coachRequirements.ageGroup}
- Primary Focus: ${params.coachRequirements.focus}
- Total Duration: ${params.coachRequirements.duration} minutes
- Goals: ${params.coachRequirements.goals || "General skill development"}
- Team profile summary: ${JSON.stringify(profileSummary)}

Drills:
${JSON.stringify(drillsPayload)}

Rules:
- Return ONLY valid JSON with no markdown.
- Output must be an object where keys are drill ids and values are one-sentence explanations.
- Each sentence should be specific to the drill, mention its purpose/benefit, and relate to practice flow or team needs.
- Avoid templates or repeating phrasing across drills; vary wording naturally.
- Do not start sentences with "Selected to" or "Chosen because".
- Use simple words that any coach can understand (around a 8th-grade reading level).
- Keep sentences short and clear; avoid jargon or overly technical terms.
Example output:
{"drill_id_1":"Sentence here.","drill_id_2":"Sentence here."}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed || typeof parsed !== "object") {
      throw new Error("Invalid explain-why response format from Gemini");
    }

    return parsed as Record<string, string>;
  } catch (error) {
    console.error("Error generating drill explain-why text:", error);
    return {};
  }
}

export async function summarizeIntentForPlanning(searchText: string): Promise<PlanningIntent> {
  try {
    const model = getGenAIClient().getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `You are helping a basketball coach quickly set up a practice session.
Input: "${searchText}"

Analyze the coach's intent and return JSON with the following shape:
{
  "primary_focus": string // The main focus area. Must be one of: offense, defense, conditioning, passing, shooting, ball-movement
  "secondary_focuses": string[] // Additional focus areas (0-2 items). Use the same allowed values.
  "suggested_goals": string // A 1-2 sentence description of what the practice should achieve based on this intent
  "drill_keywords": string[] // 3-5 keywords that could be used to find relevant drills (e.g., "press break", "trap", "ball handling", "full court", "transition")
}

Rules:
- Return ONLY valid JSON, no markdown or explanations.
- For "full court press" related queries, suggest offense + ball-movement + conditioning focuses.
- For "turnovers" related queries, suggest passing + ball-movement focuses.
- Keep suggested_goals actionable and specific to the input.
- drill_keywords should be specific basketball terms that match drill tags/names.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const cleanJson = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed || typeof parsed.primary_focus !== "string" || typeof parsed.suggested_goals !== "string") {
      throw new Error("Invalid planning intent response format from Gemini");
    }

    return {
      primary_focus: parsed.primary_focus,
      secondary_focuses: Array.isArray(parsed.secondary_focuses) ? parsed.secondary_focuses : [],
      suggested_goals: parsed.suggested_goals,
      drill_keywords: Array.isArray(parsed.drill_keywords) ? parsed.drill_keywords : [],
    };
  } catch (error) {
    console.error("Error summarizing intent for planning:", error);
    throw error;
  }
  }