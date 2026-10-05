const supabaseUrl = process.env.VITE_SUPABASE_URL;
const publishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required to verify the live schema."
  );
}

const tableChecks = {
  profiles: ["id", "coach_name", "email", "created_at", "updated_at"],
  coach_profiles: [
    "id",
    "coach_name",
    "email",
    "organization",
    "avatar_url",
    "created_at",
    "updated_at",
  ],
  teams: [
    "id",
    "coach_id",
    "team_name",
    "sport",
    "organization",
    "logo_url",
    "team_profile_summary",
    "created_at",
    "updated_at",
  ],
  players: ["id", "team_id", "name", "position", "height", "experience", "attendance", "created_at"],
  drills: [
    "id",
    "coach_id",
    "name",
    "focus",
    "duration",
    "rating",
    "verified",
    "description",
    "cues",
    "tags",
    "media_url",
    "min_players",
    "max_players",
    "optimal_group_size",
    "level",
    "intensity",
    "positions_emphasis",
    "requires_full_court",
    "is_template",
    "created_at",
    "updated_at",
  ],
  practices: [
    "id",
    "coach_id",
    "team_id",
    "title",
    "scheduled_date",
    "notes",
    "duration",
    "plan_details",
    "feedback_rating",
    "feedback_notes",
    "completed_at",
    "created_at",
    "updated_at",
  ],
  practice_drill_outcomes: [
    "id",
    "coach_id",
    "team_id",
    "drill_id",
    "total_sessions",
    "total_completed",
    "avg_completion_percent",
    "avg_feedback_rating",
    "feedback_count",
    "last_feedback_rating",
    "last_feedback_notes",
    "created_at",
    "updated_at",
  ],
  practice_plans: [
    "id",
    "coach_id",
    "team_id",
    "name",
    "date",
    "notes",
    "completed",
    "created_at",
    "updated_at",
  ],
  practice_plan_items: ["id", "practice_plan_id", "drill_id", "order_index", "duration", "notes", "groups"],
  drill_feedback: ["id", "practice_plan_id", "drill_id", "coach_id", "mood", "comment", "created_at"],
};

const headers = { apikey: publishableKey, Accept: "application/json" };

for (const [table, columns] of Object.entries(tableChecks)) {
  const query = new URL(`${supabaseUrl}/rest/v1/${table}`);
  query.searchParams.set("select", columns.join(","));
  query.searchParams.set("limit", "1");

  const response = await fetch(query, { headers });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${table} schema check failed (${response.status}): ${detail}`);
  }
}

const storageResponse = await fetch(`${supabaseUrl}/storage/v1/object/list/team-logos`, {
  method: "POST",
  headers: {
    ...headers,
    Authorization: `Bearer ${publishableKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prefix: "", limit: 1, offset: 0 }),
});

if (!storageResponse.ok) {
  const detail = await storageResponse.text();
  throw new Error(`team-logos storage check failed (${storageResponse.status}): ${detail}`);
}

console.log(
  `Supabase schema verified: ${Object.keys(tableChecks).length} tables and the team-logos bucket are available.`
);
