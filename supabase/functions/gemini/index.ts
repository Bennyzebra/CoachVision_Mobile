import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.1";
import { createClient } from "npm:@supabase/supabase-js@2.76.1";

type GeminiAction =
  | "generatePracticePlan"
  | "generateDrillExplainWhys"
  | "summarizeIntentForPlanning"
  | "parseSearchIntent";

type GeminiFunctionRequest = {
  action: GeminiAction;
  payload: unknown;
};

type CoachRequirements = {
  ageGroup: string;
  focus: string;
  duration: number;
  goals?: string;
  intensityPreference?: "recovery" | "light" | "balanced" | "intense" | "high";
  preferredDrillIds?: string[];
  coachId?: string;
  teamId?: string;
};

type DrillData = {
  id: string;
  name: string;
  category?: string;
  duration_min?: number;
  duration?: number;
  intensity?: number;
  focus_tags?: string[];
  [key: string]: unknown;
};

type DrillOutcomeSummary = {
  drill_id: string;
  total_sessions: number;
  total_completed: number;
  avg_completion_percent: number;
  avg_feedback_rating: number;
  last_feedback_notes: string | null;
};

type GeneratePracticePlanPayload = {
  coachRequirements: CoachRequirements;
  availableDrills: DrillData[];
  preferredDrillIds?: string[];
};

type GenerateDrillExplainWhysPayload = {
  coachRequirements: CoachRequirements;
  teamProfileSummary?: {
    strengths?: unknown;
    weaknesses?: unknown;
    recentThemes?: unknown;
  } | null;
  drills: Array<{
    id: string;
    name: string;
    focus?: string;
    duration?: number;
    segment?: string;
    tags?: string[];
  }>;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const normalizeIntensityPreference = (value?: CoachRequirements["intensityPreference"]) => {
  if (value === "high" || value === "intense") return "intense";
  if (value === "recovery" || value === "light" || value === "balanced") return value;
  return "balanced";
};

const intensityGuidance = (value?: CoachRequirements["intensityPreference"]) => {
  const preference = normalizeIntensityPreference(value);

  if (preference === "recovery") {
    return "Practice Intensity: recovery. Prefer drill intensity 1-2 and avoid conditioning-heavy or high-fatigue drills.";
  }

  if (preference === "light") {
    return "Practice Intensity: light. Prefer drill intensity 2-3 while keeping the session active and teachable.";
  }

  if (preference === "intense") {
    return "Practice Intensity: intense. Prefer drill intensity 4-5 where the focus, time, and player constraints allow.";
  }

  return "Practice Intensity: balanced. Preserve a natural progression from lighter early work to stronger main-segment intensity.";
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });

const parseGeminiJson = (text: string) => {
  const cleanJson = text.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  return JSON.parse(cleanJson);
};

const createAuthedSupabaseClient = (authorization: string) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
};

const getModel = () => {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw Object.assign(new Error("Gemini API key is not configured. Set the GEMINI_API_KEY Supabase secret."), {
      code: "missing_gemini_key",
      status: 500,
    });
  }

  return new GoogleGenerativeAI(apiKey).getGenerativeModel({ model: "gemini-2.5-flash" });
};

const generateContentJson = async (prompt: string) => {
  const result = await getModel().generateContent(prompt);
  const response = await result.response;
  return parseGeminiJson(response.text());
};

const handleParseSearchIntent = async (payload: unknown) => {
  const searchText = (payload as { searchText?: string }).searchText ?? "";
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

  const parsed = await generateContentJson(prompt);

  if (!parsed || !Array.isArray(parsed.focus) || typeof parsed.goals !== "string") {
    throw new Error("Invalid intent response format from Gemini");
  }

  return parsed;
};

const handleSummarizeIntentForPlanning = async (payload: unknown) => {
  const searchText = (payload as { searchText?: string }).searchText ?? "";
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

  const parsed = await generateContentJson(prompt);

  if (!parsed || typeof parsed.primary_focus !== "string" || typeof parsed.suggested_goals !== "string") {
    throw new Error("Invalid planning intent response format from Gemini");
  }

  return {
    primary_focus: parsed.primary_focus,
    secondary_focuses: Array.isArray(parsed.secondary_focuses) ? parsed.secondary_focuses : [],
    suggested_goals: parsed.suggested_goals,
    drill_keywords: Array.isArray(parsed.drill_keywords) ? parsed.drill_keywords : [],
  };
};

const buildPracticeMemoryContext = async (authorization: string) => {
  const supabase = createAuthedSupabaseClient(authorization);
  if (!supabase) return "";

  const { data: practiceHistory, error } = await supabase
    .from("practices")
    .select("feedback_notes, feedback_rating, completed_at")
    .not("feedback_notes", "is", null)
    .order("completed_at", { ascending: false });

  if (error || !practiceHistory?.length) {
    return "";
  }

  const feedbackThemes = new Set<string>();
  practiceHistory.slice(0, 5).forEach(({ feedback_notes }) => {
    const normalized = (feedback_notes ?? "").toLowerCase();
    if (!normalized) return;
    if (/(boring|monotonous|repetitive|same drills|same drill)/.test(normalized)) {
      feedbackThemes.add("Increase variety across drills and activities.");
      return;
    }
    if (/(too easy|not challenging|too basic)/.test(normalized)) {
      feedbackThemes.add("Raise difficulty and competitive intensity.");
      return;
    }
    if (/(too hard|too intense|fatiguing|exhausting)/.test(normalized)) {
      feedbackThemes.add("Balance intensity with recovery.");
      return;
    }
    if (/(unclear|confusing|instructions|explain)/.test(normalized)) {
      feedbackThemes.add("Provide clearer instructions and demonstrations.");
      return;
    }
    if (/(too long|ran long|over time|time management)/.test(normalized)) {
      feedbackThemes.add("Tighten timing and keep segments on schedule.");
      return;
    }
    if (/(too short|rushed|not enough time)/.test(normalized)) {
      feedbackThemes.add("Allow adequate time for key drills.");
      return;
    }
    if (/(warmup|cool down|cooldown)/.test(normalized)) {
      feedbackThemes.add("Improve warmup and cool down structure.");
      return;
    }
    feedbackThemes.add("Address additional coach feedback about practice structure and pacing.");
  });

  if (feedbackThemes.size === 0) return "";

  return `
PAST FEEDBACK THEMES (use as constraints, do not quote directly):
${Array.from(feedbackThemes).map((theme) => `- ${theme}`).join("\n")}
`;
};

const buildDrillOutcomeContext = async (
  authorization: string,
  coachRequirements: CoachRequirements,
  availableDrills: DrillData[]
) => {
  if (!coachRequirements.coachId || !coachRequirements.teamId) return "";

  const supabase = createAuthedSupabaseClient(authorization);
  if (!supabase) return "";

  const { data: drillOutcomes, error } = await supabase
    .from("practice_drill_outcomes")
    .select("drill_id, total_sessions, total_completed, avg_completion_percent, avg_feedback_rating, last_feedback_notes")
    .eq("coach_id", coachRequirements.coachId)
    .eq("team_id", coachRequirements.teamId)
    .order("total_sessions", { ascending: false })
    .limit(20);

  if (error || !drillOutcomes?.length) {
    return "";
  }

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

  return `
TEAM DRILL OUTCOMES (use for variety + effectiveness, do not quote directly):
High-performing drills:
${strongest.map(formatOutcome).join("\n")}
Needs improvement:
${weakest.map(formatOutcome).join("\n")}
`;
};

const handleGeneratePracticePlan = async (payload: unknown, authorization: string) => {
  const { coachRequirements, availableDrills, preferredDrillIds } = payload as GeneratePracticePlanPayload;

  if (!availableDrills || availableDrills.length === 0) {
    throw new Error("No drills available. Please add drills to your library first.");
  }

  const memoryContext = await buildPracticeMemoryContext(authorization);
  const drillOutcomeContext = await buildDrillOutcomeContext(authorization, coachRequirements, availableDrills);
  const preferredDrills = preferredDrillIds?.length
    ? availableDrills.filter((drill) => preferredDrillIds.includes(drill.id))
    : [];
  const preferredDrillsContext = preferredDrills.length
    ? `
PREFERRED DRILLS (Coach has specifically pinned these - PRIORITIZE including them):
${preferredDrills.map((drill) => `- ${drill.name} (ID: ${drill.id}, Duration: ${drill.duration_min}min)`).join("\n")}
These drills should be strongly favored in the plan when they fit the focus and time constraints.
`
    : "";
  const drillListString = JSON.stringify(
    availableDrills.map((drill) => ({
      id: drill.id,
      name: drill.name,
      category: drill.category,
      duration_min: drill.duration_min,
      intensity: drill.intensity,
      focus_tags: drill.focus_tags,
    }))
  );

  const prompt = `You are an expert basketball coach creating a practice plan.
${memoryContext}
${drillOutcomeContext}
${preferredDrillsContext}

CONTEXT:
- Age/Experience Level: ${coachRequirements.ageGroup}
- Primary Focus: ${coachRequirements.focus}
- Total Duration: ${coachRequirements.duration} minutes
- Goals: ${coachRequirements.goals || "General skill development"}
- ${intensityGuidance(coachRequirements.intensityPreference)}

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

  const parsed = await generateContentJson(prompt);

  if (!parsed.warmup || !parsed.main_segment || !parsed.cool_down) {
    throw new Error("Invalid response format from AI");
  }

  return parsed;
};

const handleGenerateDrillExplainWhys = async (payload: unknown) => {
  const params = payload as GenerateDrillExplainWhysPayload;
  if (!params.drills.length) return {};

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

  const parsed = await generateContentJson(prompt);

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid explain-why response format from Gemini");
  }

  return parsed;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const authorization = req.headers.get("Authorization");
  if (!authorization) {
    return jsonResponse({ error: "Authentication required." }, 401);
  }

  try {
    const { action, payload } = (await req.json()) as GeminiFunctionRequest;

    switch (action) {
      case "generatePracticePlan":
        return jsonResponse(await handleGeneratePracticePlan(payload, authorization));
      case "generateDrillExplainWhys":
        return jsonResponse(await handleGenerateDrillExplainWhys(payload));
      case "summarizeIntentForPlanning":
        return jsonResponse(await handleSummarizeIntentForPlanning(payload));
      case "parseSearchIntent":
        return jsonResponse(await handleParseSearchIntent(payload));
      default:
        return jsonResponse({ error: "Invalid Gemini action.", code: "invalid_action" }, 400);
    }
  } catch (error) {
    const status = (error as { status?: number }).status ?? 500;
    const code = (error as { code?: string }).code ?? "gemini_request_failed";
    const message = error instanceof Error ? error.message : "Gemini request failed.";
    return jsonResponse({ error: message, code }, status);
  }
});
