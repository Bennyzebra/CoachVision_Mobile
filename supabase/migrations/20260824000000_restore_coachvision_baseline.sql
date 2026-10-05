-- CoachVision baseline recovery.
--
-- This migration is safe to run repeatedly and only creates or updates
-- CoachVision-owned objects in the public and storage schemas. It intentionally
-- does not reference the unrelated public.coaches table already in this project.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  CREATE TYPE public.app_role AS ENUM ('coach', 'org_admin', 'platform_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_name TEXT NOT NULL DEFAULT 'Coach',
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_name TEXT,
  email TEXT,
  organization TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  organization TEXT,
  logo_url TEXT,
  team_profile_summary JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT CHECK (position IN ('G', 'F', 'C')),
  height TEXT NOT NULL,
  experience TEXT CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  attendance JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.drills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  focus TEXT NOT NULL CHECK (focus IN ('offense', 'defense', 'passing', 'conditioning')),
  duration INTEGER NOT NULL DEFAULT 10,
  rating NUMERIC(3,2) NOT NULL DEFAULT 0,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT NOT NULL,
  cues TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  media_url TEXT,
  min_players INTEGER,
  max_players INTEGER,
  optimal_group_size INTEGER,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  intensity INTEGER CHECK (intensity BETWEEN 1 AND 5),
  positions_emphasis JSONB NOT NULL DEFAULT '{}'::JSONB,
  requires_full_court BOOLEAN NOT NULL DEFAULT FALSE,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Older CoachVision deployments stored these fields as scalar text. Normalize
-- them before adding the array GIN index and restoring the canonical catalog.
DO $$
DECLARE
  target_column TEXT;
  column_type TEXT;
BEGIN
  FOREACH target_column IN ARRAY ARRAY['cues', 'tags']
  LOOP
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'drills'
      AND column_name = target_column;

    IF column_type = 'text' THEN
      EXECUTE format('ALTER TABLE public.drills ALTER COLUMN %I DROP DEFAULT', target_column);
      EXECUTE format(
        'ALTER TABLE public.drills ALTER COLUMN %I TYPE TEXT[] USING CASE WHEN %I IS NULL THEN ARRAY[]::TEXT[] ELSE ARRAY[%I] END',
        target_column,
        target_column,
        target_column
      );
      EXECUTE format('ALTER TABLE public.drills ALTER COLUMN %I SET DEFAULT ARRAY[]::TEXT[]', target_column);
    ELSIF column_type <> 'ARRAY' THEN
      RAISE EXCEPTION 'public.drills.% has unsupported type %; expected text or text[]', target_column, column_type;
    END IF;
  END LOOP;
END $$;

-- Global catalog drills deliberately have no coach owner.
ALTER TABLE public.drills ALTER COLUMN coach_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.practices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  title TEXT,
  scheduled_date TIMESTAMPTZ,
  notes TEXT,
  duration INTEGER NOT NULL,
  plan_details JSONB NOT NULL DEFAULT '{}'::JSONB,
  feedback_rating NUMERIC(4,2),
  feedback_notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_id, team_id, drill_id)
);

CREATE TABLE IF NOT EXISTS public.practice_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.practice_plan_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_plan_id UUID NOT NULL REFERENCES public.practice_plans(id) ON DELETE CASCADE,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  duration INTEGER NOT NULL,
  notes TEXT,
  groups JSONB NOT NULL DEFAULT '[]'::JSONB
);

CREATE TABLE IF NOT EXISTS public.drill_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practice_plan_id UUID REFERENCES public.practice_plans(id) ON DELETE SET NULL,
  drill_id UUID NOT NULL REFERENCES public.drills(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mood TEXT NOT NULL CHECK (mood IN ('happy', 'meh', 'sad')),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);

CREATE TABLE IF NOT EXISTS public.shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('drill', 'plan')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'followers', 'private')),
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  age_levels TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  skill_focus TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  duration_mins INTEGER,
  equipment TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  media JSONB NOT NULL DEFAULT '[]'::JSONB,
  source_ref JSONB,
  attribution JSONB,
  sponsored BOOLEAN NOT NULL DEFAULT FALSE,
  sponsor_meta JSONB,
  views_count INTEGER NOT NULL DEFAULT 0,
  saves_count INTEGER NOT NULL DEFAULT 0,
  forks_count INTEGER NOT NULL DEFAULT 0,
  used_in_plans_count INTEGER NOT NULL DEFAULT 0,
  rating NUMERIC(3,2),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.shared_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.shared_items(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'removed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shared_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.shared_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, item_id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_drill_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drill_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, coach_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'coach_name', 'Coach'), NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET coach_name = EXCLUDED.coach_name, email = EXCLUDED.email;

  INSERT INTO public.coach_profiles (id, coach_name, email, organization)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'coach_name', 'Coach'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'organization'
  )
  ON CONFLICT (id) DO UPDATE
  SET coach_name = EXCLUDED.coach_name, email = EXCLUDED.email,
      organization = COALESCE(EXCLUDED.organization, public.coach_profiles.organization);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['profiles', 'coach_profiles', 'teams', 'players', 'drills', 'practices', 'practice_drill_outcomes', 'practice_plans', 'shared_items']
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%I_updated_at ON public.%I', table_name, table_name);
    EXECUTE format('CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', table_name, table_name);
  END LOOP;
END $$;

-- Replace only CoachVision policies, keeping unrelated-project policies intact.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = ANY (ARRAY['profiles', 'coach_profiles', 'teams', 'players', 'drills', 'practices', 'practice_drill_outcomes', 'practice_plans', 'practice_plan_items', 'drill_feedback', 'user_roles', 'follows', 'shared_items', 'comments', 'reports', 'saved_items', 'likes'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', policy_record.policyname, policy_record.schemaname, policy_record.tablename);
  END LOOP;
END $$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated USING ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "coach_profiles_select_visible" ON public.coach_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "coach_profiles_insert_own" ON public.coach_profiles FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "coach_profiles_update_own" ON public.coach_profiles FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "teams_select_own" ON public.teams FOR SELECT TO authenticated USING (coach_id = (SELECT auth.uid()));
CREATE POLICY "teams_insert_own" ON public.teams FOR INSERT TO authenticated WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "teams_update_own" ON public.teams FOR UPDATE TO authenticated USING (coach_id = (SELECT auth.uid())) WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "teams_delete_own" ON public.teams FOR DELETE TO authenticated USING (coach_id = (SELECT auth.uid()));

CREATE POLICY "players_select_by_coach" ON public.players FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = players.team_id AND teams.coach_id = (SELECT auth.uid())));
CREATE POLICY "players_insert_by_coach" ON public.players FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = players.team_id AND teams.coach_id = (SELECT auth.uid())));
CREATE POLICY "players_update_by_coach" ON public.players FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = players.team_id AND teams.coach_id = (SELECT auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = players.team_id AND teams.coach_id = (SELECT auth.uid())));
CREATE POLICY "players_delete_by_coach" ON public.players FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.teams WHERE teams.id = players.team_id AND teams.coach_id = (SELECT auth.uid())));

CREATE POLICY "drills_select_accessible" ON public.drills FOR SELECT TO authenticated USING (coach_id = (SELECT auth.uid()) OR coach_id IS NULL OR is_template OR verified);
CREATE POLICY "drills_insert_own" ON public.drills FOR INSERT TO authenticated WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "drills_update_own" ON public.drills FOR UPDATE TO authenticated USING (coach_id = (SELECT auth.uid())) WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "drills_delete_own" ON public.drills FOR DELETE TO authenticated USING (coach_id = (SELECT auth.uid()));

CREATE POLICY "practices_select_own" ON public.practices FOR SELECT TO authenticated USING (coach_id = (SELECT auth.uid()));
CREATE POLICY "practices_insert_own" ON public.practices FOR INSERT TO authenticated WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "practices_update_own" ON public.practices FOR UPDATE TO authenticated USING (coach_id = (SELECT auth.uid())) WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "practices_delete_own" ON public.practices FOR DELETE TO authenticated USING (coach_id = (SELECT auth.uid()));

CREATE POLICY "outcomes_select_own" ON public.practice_drill_outcomes FOR SELECT TO authenticated USING (coach_id = (SELECT auth.uid()));
CREATE POLICY "outcomes_insert_own" ON public.practice_drill_outcomes FOR INSERT TO authenticated WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "outcomes_update_own" ON public.practice_drill_outcomes FOR UPDATE TO authenticated USING (coach_id = (SELECT auth.uid())) WITH CHECK (coach_id = (SELECT auth.uid()));

CREATE POLICY "plans_select_own" ON public.practice_plans FOR SELECT TO authenticated USING (coach_id = (SELECT auth.uid()));
CREATE POLICY "plans_write_own" ON public.practice_plans FOR ALL TO authenticated USING (coach_id = (SELECT auth.uid())) WITH CHECK (coach_id = (SELECT auth.uid()));
CREATE POLICY "plan_items_access_own" ON public.practice_plan_items FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.practice_plans WHERE practice_plans.id = practice_plan_items.practice_plan_id AND practice_plans.coach_id = (SELECT auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM public.practice_plans WHERE practice_plans.id = practice_plan_items.practice_plan_id AND practice_plans.coach_id = (SELECT auth.uid())));
CREATE POLICY "feedback_access_own" ON public.drill_feedback FOR ALL TO authenticated USING (coach_id = (SELECT auth.uid())) WITH CHECK (coach_id = (SELECT auth.uid()));

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "follows_select_all" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "follows_write_own" ON public.follows FOR ALL TO authenticated USING (follower_id = (SELECT auth.uid())) WITH CHECK (follower_id = (SELECT auth.uid()));
CREATE POLICY "shared_items_select_visible" ON public.shared_items FOR SELECT TO authenticated USING (visibility = 'public' OR owner_user_id = (SELECT auth.uid()) OR (visibility = 'followers' AND EXISTS (SELECT 1 FROM public.follows WHERE follows.follower_id = (SELECT auth.uid()) AND follows.followed_id = shared_items.owner_user_id)));
CREATE POLICY "shared_items_write_own" ON public.shared_items FOR ALL TO authenticated USING (owner_user_id = (SELECT auth.uid())) WITH CHECK (owner_user_id = (SELECT auth.uid()));
CREATE POLICY "comments_select_visible" ON public.comments FOR SELECT TO authenticated USING (status = 'active' OR user_id = (SELECT auth.uid()));
CREATE POLICY "comments_insert_own" ON public.comments FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "comments_update_own" ON public.comments FOR UPDATE TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "comments_delete_own" ON public.comments FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT TO authenticated WITH CHECK (reporter_user_id = (SELECT auth.uid()));
CREATE POLICY "saved_items_access_own" ON public.saved_items FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY "likes_select_all" ON public.likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "likes_write_own" ON public.likes FOR ALL TO authenticated USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON public.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_drills_coach_id ON public.drills(coach_id);
CREATE INDEX IF NOT EXISTS idx_drills_focus ON public.drills(focus);
CREATE INDEX IF NOT EXISTS idx_drills_tags ON public.drills USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_practices_coach_id ON public.practices(coach_id);
CREATE INDEX IF NOT EXISTS idx_practices_team_id ON public.practices(team_id);
CREATE INDEX IF NOT EXISTS idx_practices_scheduled_date ON public.practices(scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_outcomes_team_drill ON public.practice_drill_outcomes(team_id, drill_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON public.follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_owner ON public.shared_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_comments_item ON public.comments(item_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('team-logos', 'team-logos', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "team_logos_public_read" ON storage.objects;
DROP POLICY IF EXISTS "team_logos_insert_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "team_logos_update_own_folder" ON storage.objects;
DROP POLICY IF EXISTS "team_logos_delete_own_folder" ON storage.objects;
CREATE POLICY "team_logos_public_read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'team-logos');
CREATE POLICY "team_logos_insert_own_folder" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'team-logos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT);
CREATE POLICY "team_logos_update_own_folder" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'team-logos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT) WITH CHECK (bucket_id = 'team-logos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT);
CREATE POLICY "team_logos_delete_own_folder" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'team-logos' AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT);
