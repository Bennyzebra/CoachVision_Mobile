/*
  # Fix Comprehensive Security Issues

  This migration addresses multiple security and performance issues identified in the database:

  ## 1. Indexes for Foreign Keys
  - Add missing indexes on foreign key columns to improve query performance:
    - comments.author_id
    - drill_feedback.coach_id  
    - drill_feedback.drill_id
    - old drill library.coach_id

  ## 2. Optimize RLS Policies
  - Update all RLS policies to use `(select auth.uid())` instead of `auth.uid()` for better performance
  - This prevents re-evaluation of the auth function for each row
  - Affects policies on: coach_profiles, teams, comments, saved_items, drill_feedback, old drill library, practices, drills, profiles

  ## 3. Fix Multiple Permissive Policies
  - Consolidate overlapping policies to avoid conflicts:
    - comments: Merge insert/select policies
    - drills: Remove duplicate SELECT policy
    - old drill library: Remove duplicate SELECT policy
    - practices: Remove duplicate SELECT policy

  ## 4. Add Policies to coaches Table
  - coaches table has RLS enabled but no policies - adding appropriate policies

  ## 5. Fix Function Search Paths
  - Update functions to use immutable search_path for security

  ## 6. Enable RLS on players Table
  - Enable RLS and add appropriate policies for team-based access

  ## 7. Remove Unused Indexes
  - Drop indexes that aren't being used to reduce maintenance overhead
*/

-- ============================================================================
-- 1. ADD MISSING INDEXES FOR FOREIGN KEYS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_drill_feedback_coach_id ON drill_feedback(coach_id);
CREATE INDEX IF NOT EXISTS idx_drill_feedback_drill_id ON drill_feedback(drill_id);
CREATE INDEX IF NOT EXISTS idx_old_drill_library_coach_id ON "old drill library"(coach_id);

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - DROP EXISTING POLICIES
-- ============================================================================

-- Drop all existing policies that need optimization
DROP POLICY IF EXISTS "profiles_select_own" ON coach_profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON coach_profiles;
DROP POLICY IF EXISTS "teams_manage_own" ON teams;
DROP POLICY IF EXISTS "comments_insert_auth" ON comments;
DROP POLICY IF EXISTS "comments_select_auth" ON comments;
DROP POLICY IF EXISTS "comments_update_delete_own" ON comments;
DROP POLICY IF EXISTS "saved_items_manage_own" ON saved_items;
DROP POLICY IF EXISTS "feedback_select_owner_only" ON drill_feedback;
DROP POLICY IF EXISTS "feedback_insert_owner_only" ON drill_feedback;
DROP POLICY IF EXISTS "feedback_update_owner_only" ON drill_feedback;
DROP POLICY IF EXISTS "feedback_delete_owner_only" ON drill_feedback;
DROP POLICY IF EXISTS "drills_modify_own" ON "old drill library";
DROP POLICY IF EXISTS "select_own_or_template_drills" ON "old drill library";
DROP POLICY IF EXISTS "Coaches see their own practices" ON practices;
DROP POLICY IF EXISTS "Coaches can view own practices" ON practices;
DROP POLICY IF EXISTS "Coaches can create practices" ON practices;
DROP POLICY IF EXISTS "Coaches can update own practices" ON practices;
DROP POLICY IF EXISTS "Coaches can delete own practices" ON practices;
DROP POLICY IF EXISTS "Users can view drills" ON drills;
DROP POLICY IF EXISTS "Coach view policy" ON drills;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- ============================================================================
-- 2. OPTIMIZE RLS POLICIES - CREATE OPTIMIZED POLICIES
-- ============================================================================

-- coach_profiles policies
CREATE POLICY "profiles_select_own" ON coach_profiles
  FOR SELECT TO public
  USING ((select auth.uid()) = id);

CREATE POLICY "profiles_update_own" ON coach_profiles
  FOR UPDATE TO public
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own" ON coach_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

-- teams policies
CREATE POLICY "teams_select_own" ON teams
  FOR SELECT TO public
  USING (coach_id = (select auth.uid()));

CREATE POLICY "teams_insert_own" ON teams
  FOR INSERT TO public
  WITH CHECK (coach_id = (select auth.uid()));

CREATE POLICY "teams_update_own" ON teams
  FOR UPDATE TO public
  USING (coach_id = (select auth.uid()))
  WITH CHECK (coach_id = (select auth.uid()));

CREATE POLICY "teams_delete_own" ON teams
  FOR DELETE TO public
  USING (coach_id = (select auth.uid()));

-- comments policies (consolidated)
CREATE POLICY "comments_select_all" ON comments
  FOR SELECT TO public
  USING (true);

CREATE POLICY "comments_insert_authenticated" ON comments
  FOR INSERT TO public
  WITH CHECK ((select auth.uid()) = author_id);

CREATE POLICY "comments_update_own" ON comments
  FOR UPDATE TO public
  USING ((select auth.uid()) = author_id)
  WITH CHECK ((select auth.uid()) = author_id);

CREATE POLICY "comments_delete_own" ON comments
  FOR DELETE TO public
  USING ((select auth.uid()) = author_id);

-- saved_items policies
CREATE POLICY "saved_items_select_own" ON saved_items
  FOR SELECT TO public
  USING ((select auth.uid()) = user_id);

CREATE POLICY "saved_items_insert_own" ON saved_items
  FOR INSERT TO public
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "saved_items_delete_own" ON saved_items
  FOR DELETE TO public
  USING ((select auth.uid()) = user_id);

-- drill_feedback policies
CREATE POLICY "feedback_select_own" ON drill_feedback
  FOR SELECT TO public
  USING (coach_id = (select auth.uid()));

CREATE POLICY "feedback_insert_own" ON drill_feedback
  FOR INSERT TO public
  WITH CHECK (coach_id = (select auth.uid()));

CREATE POLICY "feedback_update_own" ON drill_feedback
  FOR UPDATE TO public
  USING (coach_id = (select auth.uid()))
  WITH CHECK (coach_id = (select auth.uid()));

CREATE POLICY "feedback_delete_own" ON drill_feedback
  FOR DELETE TO public
  USING (coach_id = (select auth.uid()));

-- old drill library policies (consolidated)
CREATE POLICY "drills_select_accessible" ON "old drill library"
  FOR SELECT TO authenticated
  USING ((coach_id = (select auth.uid())) OR (COALESCE(is_template, false) = true));

CREATE POLICY "drills_insert_own" ON "old drill library"
  FOR INSERT TO public
  WITH CHECK (coach_id = (select auth.uid()));

CREATE POLICY "drills_update_own" ON "old drill library"
  FOR UPDATE TO public
  USING (coach_id = (select auth.uid()))
  WITH CHECK (coach_id = (select auth.uid()));

CREATE POLICY "drills_delete_own" ON "old drill library"
  FOR DELETE TO public
  USING (coach_id = (select auth.uid()));

-- practices policies (consolidated)
CREATE POLICY "practices_select_own" ON practices
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = coach_id);

CREATE POLICY "practices_insert_own" ON practices
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = coach_id);

CREATE POLICY "practices_update_own" ON practices
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = coach_id)
  WITH CHECK ((select auth.uid()) = coach_id);

CREATE POLICY "practices_delete_own" ON practices
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = coach_id);

-- drills policies (consolidated - single policy)
CREATE POLICY "drills_select_accessible" ON drills
  FOR SELECT TO authenticated
  USING (((select auth.uid()) = coach_id) OR (is_template = true) OR (verified = true));

-- profiles policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- 4. ADD POLICIES TO COACHES TABLE
-- ============================================================================

CREATE POLICY "coaches_select_own" ON coaches
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "coaches_insert_own" ON coaches
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "coaches_update_own" ON coaches
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- 5. FIX FUNCTION SEARCH PATHS
-- ============================================================================

-- Recreate functions with security definer and secure search_path
CREATE OR REPLACE FUNCTION set_players_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_team_name_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.name IS DISTINCT FROM OLD.name THEN
    NEW.team_name := NEW.name;
  ELSIF NEW.team_name IS DISTINCT FROM OLD.team_name THEN
    NEW.name := NEW.team_name;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_player_experience()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_player_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 6. ENABLE RLS ON PLAYERS TABLE
-- ============================================================================

ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Players can be viewed by coaches who own the team
CREATE POLICY "players_select_by_coach" ON players
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.coach_id = (select auth.uid())
    )
  );

-- Players can be inserted by team coaches
CREATE POLICY "players_insert_by_coach" ON players
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.coach_id = (select auth.uid())
    )
  );

-- Players can be updated by team coaches
CREATE POLICY "players_update_by_coach" ON players
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.coach_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.coach_id = (select auth.uid())
    )
  );

-- Players can be deleted by team coaches
CREATE POLICY "players_delete_by_coach" ON players
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM teams 
      WHERE teams.id = players.team_id 
      AND teams.coach_id = (select auth.uid())
    )
  );

-- ============================================================================
-- 7. REMOVE UNUSED INDEXES
-- ============================================================================

DROP INDEX IF EXISTS idx_practices_team_id;
DROP INDEX IF EXISTS idx_practices_created_at;
DROP INDEX IF EXISTS idx_comments_item;
DROP INDEX IF EXISTS idx_saved_items_user;
