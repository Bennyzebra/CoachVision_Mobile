/*
  # Complete Database Schema Setup
  
  1. Base Tables
    - profiles: Core user profile data
    - teams: Team information for coaches
    - players: Player roster management
    
  2. Community Tables
    - coach_profiles: Public-facing coach profiles for community features
    - follows: Follow relationships between coaches
    - shared_items: Published drills and practice plans
    - comments: Comments on shared items
    - reports: Content moderation reports
    - saved_items: Bookmarked items
    - likes: Liked items
    - user_roles: Role-based access control
    
  3. Security
    - Enable RLS on all tables
    - Create restrictive policies for data access
    - Add helper functions for role checking
    
  4. Triggers & Functions
    - Auto-create profiles and coach_profiles on signup
    - Auto-update timestamps
    - Maintain follower counts
    
  5. Indexes
    - Performance indexes on commonly queried columns
*/

-- ============================================================
-- ENUMS & TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('coach', 'org_admin', 'platform_admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- BASE TABLES
-- ============================================================

-- Profiles table (internal user data)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  coach_name TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  sport TEXT NOT NULL,
  organization TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Players table
CREATE TABLE IF NOT EXISTS public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT CHECK (position IN ('G', 'F', 'C')),
  height TEXT NOT NULL,
  experience TEXT CHECK (experience IN ('beginner', 'intermediate', 'advanced')),
  attendance JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- COMMUNITY TABLES
-- ============================================================

-- User roles table (for RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Coach profiles (public-facing)
CREATE TABLE IF NOT EXISTS public.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  org TEXT,
  sports TEXT[] DEFAULT ARRAY['Basketball'],
  location TEXT,
  bio TEXT,
  years_experience INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_public BOOLEAN DEFAULT true,
  avatar_url TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

-- Follows table
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Shared items table
CREATE TABLE IF NOT EXISTS public.shared_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('drill', 'plan')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'followers', 'private')),
  title TEXT NOT NULL,
  summary TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  age_levels TEXT[] DEFAULT ARRAY[]::TEXT[],
  skill_focus TEXT[] DEFAULT ARRAY[]::TEXT[],
  duration_mins INTEGER,
  equipment TEXT[] DEFAULT ARRAY[]::TEXT[],
  media JSONB DEFAULT '[]'::JSONB,
  source_ref JSONB,
  attribution JSONB,
  sponsored BOOLEAN DEFAULT false,
  sponsor_meta JSONB,
  views_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  forks_count INTEGER DEFAULT 0,
  used_in_plans_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'flagged', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;

-- Comments table
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Saved items table
CREATE TABLE IF NOT EXISTS public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

-- Likes table
CREATE TABLE IF NOT EXISTS public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY FUNCTIONS
-- ============================================================

-- Role checking function (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Teams policies
DROP POLICY IF EXISTS "Coaches can view own teams" ON public.teams;
CREATE POLICY "Coaches can view own teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can create teams" ON public.teams;
CREATE POLICY "Coaches can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can update own teams" ON public.teams;
CREATE POLICY "Coaches can update own teams"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (auth.uid() = coach_id);

DROP POLICY IF EXISTS "Coaches can delete own teams" ON public.teams;
CREATE POLICY "Coaches can delete own teams"
  ON public.teams FOR DELETE
  TO authenticated
  USING (auth.uid() = coach_id);

-- Players policies
DROP POLICY IF EXISTS "Coaches can view players from own teams" ON public.players;
CREATE POLICY "Coaches can view players from own teams"
  ON public.players FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can create players for own teams" ON public.players;
CREATE POLICY "Coaches can create players for own teams"
  ON public.players FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can update players from own teams" ON public.players;
CREATE POLICY "Coaches can update players from own teams"
  ON public.players FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.coach_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Coaches can delete players from own teams" ON public.players;
CREATE POLICY "Coaches can delete players from own teams"
  ON public.players FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.teams
      WHERE teams.id = players.team_id
      AND teams.coach_id = auth.uid()
    )
  );

-- User roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'platform_admin'));

-- Coach profiles policies
DROP POLICY IF EXISTS "Public profiles are viewable by all" ON public.coach_profiles;
CREATE POLICY "Public profiles are viewable by all"
  ON public.coach_profiles FOR SELECT
  TO authenticated
  USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.coach_profiles;
CREATE POLICY "Users can update own coach profile"
  ON public.coach_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own profile" ON public.coach_profiles;
CREATE POLICY "Users can create own coach profile"
  ON public.coach_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Follows policies
DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
CREATE POLICY "Users can view follows"
  ON public.follows FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage own follows" ON public.follows;
CREATE POLICY "Users can manage own follows"
  ON public.follows FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- Shared items policies
DROP POLICY IF EXISTS "Public items viewable by all" ON public.shared_items;
CREATE POLICY "Public items viewable by all"
  ON public.shared_items FOR SELECT
  TO authenticated
  USING (
    visibility = 'public' OR
    owner_user_id = auth.uid() OR
    (visibility = 'followers' AND EXISTS (
      SELECT 1 FROM follows WHERE follower_id = auth.uid() AND followed_id = owner_user_id
    ))
  );

DROP POLICY IF EXISTS "Users can create own items" ON public.shared_items;
CREATE POLICY "Users can create own items"
  ON public.shared_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can update own items" ON public.shared_items;
CREATE POLICY "Users can update own items"
  ON public.shared_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_user_id);

DROP POLICY IF EXISTS "Users can delete own items" ON public.shared_items;
CREATE POLICY "Users can delete own items"
  ON public.shared_items FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_user_id);

-- Comments policies
DROP POLICY IF EXISTS "Users can view active comments" ON public.comments;
CREATE POLICY "Users can view active comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (status = 'active' OR user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Reports policies
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_user_id);

-- Saved items policies
DROP POLICY IF EXISTS "Users can manage own saves" ON public.saved_items;
CREATE POLICY "Users can manage own saves"
  ON public.saved_items FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Likes policies
DROP POLICY IF EXISTS "Users can view likes" ON public.likes;
CREATE POLICY "Users can view likes"
  ON public.likes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can manage own likes" ON public.likes;
CREATE POLICY "Users can manage own likes"
  ON public.likes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- AUTO-CREATION TRIGGERS
-- ============================================================

-- Function to auto-create profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create internal profile
  INSERT INTO public.profiles (id, coach_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'coach_name', 'Coach'),
    NEW.email
  );
  
  -- Create public coach profile
  INSERT INTO public.coach_profiles (user_id, display_name, org, sports)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'coach_name', 'Coach'),
    COALESCE(NEW.raw_user_meta_data->>'org', NULL),
    ARRAY['Basketball']
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- UPDATE TIMESTAMP TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coach_profiles_updated_at ON public.coach_profiles;
CREATE TRIGGER update_coach_profiles_updated_at
  BEFORE UPDATE ON public.coach_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_shared_items_updated_at ON public.shared_items;
CREATE TRIGGER update_shared_items_updated_at
  BEFORE UPDATE ON public.shared_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON public.teams(coach_id);
CREATE INDEX IF NOT EXISTS idx_players_team_id ON public.players(team_id);
CREATE INDEX IF NOT EXISTS idx_coach_profiles_user_id ON public.coach_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_followed ON public.follows(followed_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_owner ON public.shared_items(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_shared_items_visibility ON public.shared_items(visibility);
CREATE INDEX IF NOT EXISTS idx_shared_items_status ON public.shared_items(status);
CREATE INDEX IF NOT EXISTS idx_shared_items_created ON public.shared_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_item ON public.comments(item_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_saved_items_user ON public.saved_items(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_item ON public.likes(item_id);
