/*
  # Add practice drill outcomes

  Tracks aggregated drill outcomes per team and coach to inform planning.
*/

CREATE TABLE IF NOT EXISTS public.practice_drill_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_completed INTEGER NOT NULL DEFAULT 0,
  avg_completion_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  avg_feedback_rating NUMERIC(4,2) NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  last_feedback_rating NUMERIC(4,2),
  last_feedback_notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, team_id, drill_id)
);

ALTER TABLE public.practice_drill_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "practice_drill_outcomes_select_own" ON public.practice_drill_outcomes;
CREATE POLICY "practice_drill_outcomes_select_own" ON public.practice_drill_outcomes
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "practice_drill_outcomes_insert_own" ON public.practice_drill_outcomes;
CREATE POLICY "practice_drill_outcomes_insert_own" ON public.practice_drill_outcomes
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "practice_drill_outcomes_update_own" ON public.practice_drill_outcomes;
CREATE POLICY "practice_drill_outcomes_update_own" ON public.practice_drill_outcomes
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = coach_id)
  WITH CHECK ((select auth.uid()) = coach_id);

CREATE INDEX IF NOT EXISTS idx_practice_drill_outcomes_team_drill
  ON public.practice_drill_outcomes (team_id, drill_id);