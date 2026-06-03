type SupabaseLikeError = {
  code?: string;
  message?: string;
  details?: string | null;
  hint?: string | null;
  status?: number;
};

export const isMissingTeamProfileSummaryColumnError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as SupabaseLikeError;
  const fullText = `${maybeError.message ?? ""} ${maybeError.details ?? ""} ${maybeError.hint ?? ""}`.toLowerCase();
  const mentionsColumn = fullText.includes("team_profile_summary");
  const mentionsTeams = fullText.includes("teams") || fullText.includes("public.teams");

  return (
    (maybeError.code === "42703" && mentionsColumn) ||
    ((maybeError.code === "PGRST204" || maybeError.code === "PGRST205") && mentionsColumn && mentionsTeams) ||
    (mentionsColumn && mentionsTeams && (fullText.includes("schema cache") || fullText.includes("does not exist")))
  );
};
