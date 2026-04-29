/*
  # Add Drill Library Database Tables

  ## Overview
  This migration creates the database schema for the drill library feature, enabling coaches to store drills, practice plans, and feedback in the database instead of local storage.

  ## New Tables

  ### 1. drills
  Stores all drill information for coaches. Each coach can create and manage their own drills.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier for the drill
  - `coach_id` (uuid, foreign key) - References profiles.id, the coach who owns this drill
  - `name` (text) - Name of the drill
  - `focus` (text) - Category: offense, defense, passing, or conditioning
  - `duration` (integer) - Default duration in minutes
  - `rating` (decimal) - Average rating from 0 to 5
  - `verified` (boolean) - Whether this is a verified/featured drill
  - `description` (text) - Detailed description of the drill
  - `cues` (text[]) - Array of coaching cues/tips
  - `tags` (text[]) - Array of tags for filtering
  - `media_url` (text) - Optional URL to video or image
  - `min_players` (integer) - Minimum number of players needed
  - `max_players` (integer) - Maximum number of players
  - `optimal_group_size` (integer) - Ideal group size
  - `level` (text) - Skill level: beginner, intermediate, or advanced
  - `intensity` (integer) - Intensity level from 1 to 5
  - `positions_emphasis` (jsonb) - JSON object with position weights (G, F, C)
  - `requires_full_court` (boolean) - Whether full court is needed
  - `is_template` (boolean) - If true, this is a default/template drill
  - `created_at` (timestamptz) - When the drill was created
  - `updated_at` (timestamptz) - When the drill was last updated

  ### 2. practice_plans
  Stores saved practice plan sessions with metadata.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `coach_id` (uuid, foreign key) - References profiles.id
  - `team_id` (uuid, foreign key) - Optional reference to teams.id
  - `name` (text) - Name of the practice plan
  - `date` (date) - Scheduled or actual practice date
  - `notes` (text) - General notes about the practice
  - `completed` (boolean) - Whether this practice was completed
  - `created_at` (timestamptz) - When the plan was created
  - `updated_at` (timestamptz) - When the plan was last updated

  ### 3. practice_plan_items
  Links drills to practice plans with ordering and customization.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `practice_plan_id` (uuid, foreign key) - References practice_plans.id
  - `drill_id` (uuid, foreign key) - References drills.id
  - `order_index` (integer) - Position in the practice plan
  - `duration` (integer) - Duration override for this instance
  - `notes` (text) - Notes specific to this drill in this plan
  - `groups` (jsonb) - Group configuration JSON

  ### 4. drill_feedback
  Stores feedback from coaches after running drills in practice.
  
  **Columns:**
  - `id` (uuid, primary key) - Unique identifier
  - `practice_plan_id` (uuid, foreign key) - References practice_plans.id
  - `drill_id` (uuid, foreign key) - References drills.id
  - `coach_id` (uuid, foreign key) - References profiles.id
  - `mood` (text) - happy, meh, or sad
  - `comment` (text) - Optional feedback comment
  - `created_at` (timestamptz) - When the feedback was recorded

  ## Security
  All tables have Row Level Security (RLS) enabled with policies that:
  - Allow coaches to view only their own drills and plans
  - Allow coaches to view template drills (is_template = true)
  - Allow coaches to create, update, and delete their own content
  - Prevent unauthorized access to other coaches' data

  ## Indexes
  Performance indexes are created on:
  - Coach IDs for fast filtering by owner
  - Focus and level fields for drill filtering
  - Tags array for tag-based searches
  - Practice plan dates for chronological queries
  - Foreign key relationships for join performance
*/

-- ============================================================
-- CREATE DRILLS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  focus TEXT NOT NULL CHECK (focus IN ('offense', 'defense', 'passing', 'conditioning')),
  duration INTEGER NOT NULL DEFAULT 10,
  rating DECIMAL(3,2) DEFAULT 0.0,
  verified BOOLEAN DEFAULT false,
  description TEXT NOT NULL,
  cues TEXT[] DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  media_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  optimal_group_size INTEGER,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 5),
  positions_emphasis JSONB DEFAULT '{}'::JSONB,
  requires_full_court BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE PRACTICE PLANS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.practice_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE PRACTICE PLAN ITEMS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.practice_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_plan_id UUID NOT NULL REFERENCES public.practice_plans(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  groups JSONB DEFAULT '[]'::JSONB
);

ALTER TABLE public.practice_plan_items ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CREATE DRILL FEEDBACK TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.drill_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_plan_id UUID REFERENCES public.practice_plans(id) ON DELETE SET NULL,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'meh', 'sad')),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.drill_feedback ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES - DRILLS
-- ============================================================

DROP POLICY IF EXISTS "Coaches can view own and template drills" ON public.drills;
CREATE POLICY "Coaches can view own and template drills"
  ON public.drills FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id OR is_template = true);

DROP POLICY IF EXISTS "Coaches can create own drills" ON public.drills;
CREATE POLICY "Coaches can create own drills"
  ON public.drills FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can update own drills" ON public.drills;
CREATE POLICY "Coaches can update own drills"
  ON public.drills FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can delete own drills" ON public.drills;
CREATE POLICY "Coaches can delete own drills"
  ON public.drills FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES - PRACTICE PLANS
-- ============================================================

DROP POLICY IF EXISTS "Coaches can view own practice plans" ON public.practice_plans;
CREATE POLICY "Coaches can view own practice plans"
  ON public.practice_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can create practice plans" ON public.practice_plans;
CREATE POLICY "Coaches can create practice plans"
  ON public.practice_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can update own practice plans" ON public.practice_plans;
CREATE POLICY "Coaches can update own practice plans"
  ON public.practice_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can delete own practice plans" ON public.practice_plans;
CREATE POLICY "Coaches can delete own practice plans"
  ON public.practice_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES - PRACTICE PLAN ITEMS
-- ============================================================

DROP POLICY IF EXISTS "Coaches can view own practice plan items" ON public.practice_plan_items;
CREATE POLICY "Coaches can view own practice plan items"
  ON public.practice_plan_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_plans
      WHERE practice_plans.id = practice_plan_items.practice_plan_id
      AND practice_plans.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can create practice plan items" ON public.practice_plan_items;
CREATE POLICY "Coaches can create practice plan items"
  ON public.practice_plan_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practice_plans
      WHERE practice_plans.id = practice_plan_items.practice_plan_id
      AND practice_plans.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can update own practice plan items" ON public.practice_plan_items;
CREATE POLICY "Coaches can update own practice plan items"
  ON public.practice_plan_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_plans
      WHERE practice_plans.id = practice_plan_items.practice_plan_id
      AND practice_plans.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can delete own practice plan items" ON public.practice_plan_items;
CREATE POLICY "Coaches can delete own practice plan items"
  ON public.practice_plan_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.practice_plans
      WHERE practice_plans.id = practice_plan_items.practice_plan_id
      AND practice_plans.coach_id = auth.uid()
    )
  );

-- ============================================================
-- ROW LEVEL SECURITY POLICIES - DRILL FEEDBACK
-- ============================================================

DROP POLICY IF EXISTS "Coaches can view own drill feedback" ON public.drill_feedback;
CREATE POLICY "Coaches can view own drill feedback"
  ON public.drill_feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can create drill feedback" ON public.drill_feedback;
CREATE POLICY "Coaches can create drill feedback"
  ON public.drill_feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can update own drill feedback" ON public.drill_feedback;
CREATE POLICY "Coaches can update own drill feedback"
  ON public.drill_feedback FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can delete own drill feedback" ON public.drill_feedback;
CREATE POLICY "Coaches can delete own drill feedback"
  ON public.drill_feedback FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- ============================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_drills_updated_at ON public.drills;
CREATE TRIGGER update_drills_updated_at
  BEFORE UPDATE ON public.drills
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_practice_plans_updated_at ON public.practice_plans;
CREATE TRIGGER update_practice_plans_updated_at
  BEFORE UPDATE ON public.practice_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_drills_coach_id ON public.drills(coach_id);
CREATE INDEX IF NOT EXISTS idx_drills_focus ON public.drills(focus);
CREATE INDEX IF NOT EXISTS idx_drills_level ON public.drills(level);
CREATE INDEX IF NOT EXISTS idx_drills_is_template ON public.drills(is_template);
CREATE INDEX IF NOT EXISTS idx_drills_tags ON public.drills USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_drills_rating ON public.drills(rating DESC);

CREATE INDEX IF NOT EXISTS idx_practice_plans_coach_id ON public.practice_plans(coach_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_team_id ON public.practice_plans(team_id);
CREATE INDEX IF NOT EXISTS idx_practice_plans_date ON public.practice_plans(date DESC);

CREATE INDEX IF NOT EXISTS idx_practice_plan_items_plan_id ON public.practice_plan_items(practice_plan_id);
CREATE INDEX IF NOT EXISTS idx_practice_plan_items_drill_id ON public.practice_plan_items(drill_id);
CREATE INDEX IF NOT EXISTS idx_practice_plan_items_order ON public.practice_plan_items(practice_plan_id, order_index);

CREATE INDEX IF NOT EXISTS idx_drill_feedback_coach_id ON public.drill_feedback(coach_id);
CREATE INDEX IF NOT EXISTS idx_drill_feedback_drill_id ON public.drill_feedback(drill_id);
CREATE INDEX IF NOT EXISTS idx_drill_feedback_plan_id ON public.drill_feedback(practice_plan_id);
