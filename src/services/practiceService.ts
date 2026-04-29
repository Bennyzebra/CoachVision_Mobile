import { supabase } from "@/integrations/supabase/client";
import { Drill } from "@/types";
import { updateTeamProfileFromFeedback, updateTeamProfileFromPracticePlan } from "@/services/teamProfileService";

export interface PracticePlan {
  warmup: Drill[];
  main_segment: Drill[];
  cool_down: Drill[];
  coach_notes: string;
}

export interface Practice {
  id: string;
  coach_id: string;
  team_id: string | null;
  title?: string | null;
  scheduled_date?: string | null;
  notes?: string | null;  
  duration: number;
  plan_details: PracticePlan;
  feedback_rating: number | null;
  feedback_notes: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface PracticeDrillOutcome {
  drillId: string;
  completionPercent?: number | null;
  feedbackRating?: number | null;
  feedbackNotes?: string | null;
}

export interface TeamDrillOutcomeSummary {
  drill_id: string;
  total_sessions: number;
  total_completed: number;
  avg_completion_percent: number;
  avg_feedback_rating: number;
  feedback_count: number;
  last_feedback_rating: number | null;
  last_feedback_notes: string | null;
}

export const isMissingPracticeDrillOutcomesRelationError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as { code?: string; message?: string; details?: string; hint?: string; status?: number };
  const fullText = `${maybeError.message ?? ""} ${maybeError.details ?? ""} ${maybeError.hint ?? ""}`.toLowerCase();

  return (
    maybeError.status === 404 ||
    maybeError.code === "PGRST116" ||
    maybeError.code === "PGRST205" ||
    (fullText.includes("relation") && fullText.includes("practice_drill_outcomes") && fullText.includes("not found")) ||
    (fullText.includes("could not find") && fullText.includes("practice_drill_outcomes"))
  );
};

const normalizePractice = (practice: Practice): Practice => ({
  ...practice,
  duration: Number(practice.duration) || 0,
});

interface ListPracticesParams {
  coachId: string;
  teamId?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  status?: "all" | "completed" | "planned";
  page?: number;
  pageSize?: number;
  sortBy?: "created_at" | "scheduled_date";
  sortOrder?: "asc" | "desc";
}

interface UpdatePracticePayload {
  title?: string | null;
  scheduled_date?: string | null;
  notes?: string | null;
  plan_details?: PracticePlan;
}

export const savePractice = async (
  coachId: string,
  teamId: string | null,
  duration: number,
  planDetails: PracticePlan,
  title?: string
): Promise<{ data: Practice | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from("practices")
      .insert({
        coach_id: coachId,
        team_id: teamId,
        duration,
        plan_details: planDetails,
        title: title?.trim() || null,        
      })
      .select()
      .maybeSingle();

    if (error) throw error;

    if (teamId) {
      try {
        await updateTeamProfileFromPracticePlan(teamId, planDetails);
      } catch (profileError) {
        console.warn("Unable to update team profile summary from practice plan:", profileError);
      }
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Error saving practice:", error);
    return { data: null, error: error as Error };
  }
};

export const getPractice = async (
  practiceId: string
): Promise<{ data: Practice | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from("practices")
      .select("*")
      .eq("id", practiceId)
      .maybeSingle();

    if (error) throw error;

    return { data: data ? normalizePractice(data as Practice) : null, error: null };
  } catch (error) {
    console.error("Error fetching practice:", error);
    return { data: null, error: error as Error };
  }
};

export const updatePracticeFeedback = async (
  practiceId: string,
  rating: number,
  notes: string,
  drillOutcomes: PracticeDrillOutcome[] = []
): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from("practices")
      .update({
        feedback_rating: rating,
        feedback_notes: notes,
        completed_at: new Date().toISOString(),
      })
      .eq("id", practiceId);

    if (error) throw error;

    const { data: practiceData, error: practiceError } = await supabase
      .from("practices")
      .select("team_id, coach_id")
      .eq("id", practiceId)
      .maybeSingle();

    if (practiceError) {
      console.warn("Unable to fetch practice team for profile update:", practiceError);
    } else if (practiceData?.team_id) {
      try {
        await updateTeamProfileFromFeedback(practiceData.team_id, notes);
      } catch (profileError) {
        console.warn("Unable to update team profile summary from feedback:", profileError);
      }

      if (drillOutcomes.length > 0) {
        await upsertPracticeDrillOutcomes({
          coachId: practiceData.coach_id,
          teamId: practiceData.team_id,
          outcomes: drillOutcomes,
        });
      }      
    }
    
    return { error: null };
  } catch (error) {
    console.error("Error updating practice feedback:", error);
    return { error: error as Error };
  }
};

export const getTeamDrillOutcomes = async (
  coachId: string,
  teamId: string
): Promise<{ data: TeamDrillOutcomeSummary[]; error: Error | null; outcomesUnavailable?: boolean }> => {
  try {
    const { data, error } = await supabase
      .from("practice_drill_outcomes")
      .select(
        "drill_id, total_sessions, total_completed, avg_completion_percent, avg_feedback_rating, feedback_count, last_feedback_rating, last_feedback_notes"
      )
      .eq("coach_id", coachId)
      .eq("team_id", teamId);

    if (error) {
      if (isMissingPracticeDrillOutcomesRelationError(error)) {
        return { data: [], error: null, outcomesUnavailable: true };
      }
      throw error;
    }
    
    return { data: data ?? [], error: null };
  } catch (error) {
    console.error("Error fetching team drill outcomes:", error);
    return { data: [], error: error as Error };
  }
};

export const getCoachPractices = async (
  coachId: string,
  teamId?: string
): Promise<{ data: Practice[] | null; error: Error | null }> => {
  try {
    let query = supabase
      .from("practices")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false });

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching practices:", error);
    return { data: null, error: error as Error };
  }
};

export const listPractices = async ({
  coachId,
  teamId,
  search,
  fromDate,
  toDate,
  status = "all",
  page = 1,
  pageSize = 10,
  sortBy = "created_at",
  sortOrder = "desc",
}: ListPracticesParams): Promise<{
  data: { data: Practice[]; total: number } | null;
  error: Error | null;
}> => {
  try {
    let query = supabase
      .from("practices")
      .select("*", { count: "exact" })
      .eq("coach_id", coachId);

    if (teamId) {
      query = query.eq("team_id", teamId);
    }

    if (search?.trim()) {
      query = query.or(`title.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    if (fromDate) {
      query = query.gte("created_at", new Date(fromDate).toISOString());
    }

    if (toDate) {
      const endDate = new Date(toDate);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte("created_at", endDate.toISOString());
    }

    if (status === "completed") {
      query = query.not("completed_at", "is", null);
    } else if (status === "planned") {
      query = query.is("completed_at", null);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order(sortBy, { ascending: sortOrder === "asc" })
      .range(from, to);

    if (error) throw error;

    return {
      data: {
        data: (data ?? []).map((item) => normalizePractice(item as Practice)),
        total: count ?? 0,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error listing practices:", error);
    return { data: null, error: error as Error };
  }
};

export const updatePractice = async (
  practiceId: string,
  coachId: string,
  updates: UpdatePracticePayload
): Promise<{ data: Practice | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from("practices")
      .update(updates)
      .eq("id", practiceId)
      .eq("coach_id", coachId)
      .select("*")
      .maybeSingle();

    if (error) throw error;

    return { data: data ? normalizePractice(data as Practice) : null, error: null };
  } catch (error) {
    console.error("Error updating practice:", error);
    return { data: null, error: error as Error };
  }
};

export const duplicatePractice = async (
  practiceId: string,
  coachId: string,
  teamId?: string
): Promise<{ data: Practice | null; error: Error | null }> => {
  try {
    const { data: source, error: sourceError } = await supabase
      .from("practices")
      .select("*")
      .eq("id", practiceId)
      .eq("coach_id", coachId)
      .maybeSingle();

    if (sourceError) throw sourceError;
    if (!source) {
      return { data: null, error: new Error("Practice not found") };
    }

    const { data, error } = await supabase
      .from("practices")
      .insert({
        coach_id: coachId,
        team_id: teamId ?? source.team_id,
        duration: source.duration,
        plan_details: source.plan_details,
        title: source.title,
        notes: source.notes,
        scheduled_date: null,
      })
      .select("*")
      .maybeSingle();

    if (error) throw error;

    return { data: data ? normalizePractice(data as Practice) : null, error: null };
  } catch (error) {
    console.error("Error duplicating practice:", error);
    return { data: null, error: error as Error };
  }
};


const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const upsertPracticeDrillOutcomes = async ({
  coachId,
  teamId,
  outcomes,
}: {
  coachId: string;
  teamId: string;
  outcomes: PracticeDrillOutcome[];
}) => {
  if (!outcomes.length) return;

  const drillIds = outcomes.map((outcome) => outcome.drillId);
  const { data: existing, error: existingError } = await supabase
    .from("practice_drill_outcomes")
    .select(
      "id, drill_id, total_sessions, total_completed, avg_completion_percent, avg_feedback_rating, feedback_count, last_feedback_rating, last_feedback_notes"
    )
    .eq("coach_id", coachId)
    .eq("team_id", teamId)
    .in("drill_id", drillIds);

  if (existingError) {
    console.warn("Unable to fetch existing drill outcomes:", existingError);
  }

  const existingMap = new Map(
    (existing ?? []).map((row) => [row.drill_id, row])
  );

  const payload = outcomes.map((outcome) => {
    const completionPercent = clamp(Number(outcome.completionPercent ?? 0), 0, 100);
    const current = existingMap.get(outcome.drillId);
    const currentSessions = current?.total_sessions ?? 0;
    const nextSessions = currentSessions + 1;
    const currentCompleted = current?.total_completed ?? 0;
    const nextCompleted = currentCompleted + (completionPercent >= 80 ? 1 : 0);
    const currentAvgCompletion = current?.avg_completion_percent ?? 0;
    const nextAvgCompletion =
      (currentAvgCompletion * currentSessions + completionPercent) / nextSessions;

    const hasRating = typeof outcome.feedbackRating === "number";
    const currentFeedbackCount = current?.feedback_count ?? 0;
    const nextFeedbackCount = hasRating ? currentFeedbackCount + 1 : currentFeedbackCount;
    const currentAvgRating = current?.avg_feedback_rating ?? 0;
    const nextAvgRating = hasRating
      ? (currentAvgRating * currentFeedbackCount + (outcome.feedbackRating ?? 0)) / nextFeedbackCount
      : currentAvgRating;

    return {
      coach_id: coachId,
      team_id: teamId,
      drill_id: outcome.drillId,
      total_sessions: nextSessions,
      total_completed: nextCompleted,
      avg_completion_percent: Number(nextAvgCompletion.toFixed(2)),
      avg_feedback_rating: Number(nextAvgRating.toFixed(2)),
      feedback_count: nextFeedbackCount,
      last_feedback_rating: hasRating ? outcome.feedbackRating : current?.last_feedback_rating ?? null,
      last_feedback_notes: outcome.feedbackNotes ?? current?.last_feedback_notes ?? null,
      updated_at: new Date().toISOString(),
    };
  });

  const { error } = await supabase
    .from("practice_drill_outcomes")
    .upsert(payload, { onConflict: "coach_id,team_id,drill_id" });

  if (error) {
    console.warn("Unable to persist practice drill outcomes:", error);
  }
};