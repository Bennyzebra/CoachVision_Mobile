ALTER TABLE public.teams
ADD COLUMN IF NOT EXISTS team_profile_summary JSONB DEFAULT '{}'::jsonb;