-- Create role enum
CREATE TYPE public.app_role AS ENUM ('coach', 'org_admin', 'platform_admin');

-- User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
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

-- RLS policies for user_roles
CREATE POLICY "Users can view own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Coach profiles (public-facing)
CREATE TABLE public.coach_profiles (
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

CREATE POLICY "Public profiles are viewable by all"
ON public.coach_profiles FOR SELECT
TO authenticated
USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
ON public.coach_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own profile"
ON public.coach_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Follows
CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  followed_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(follower_id, followed_id),
  CHECK (follower_id != followed_id)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view follows"
ON public.follows FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage own follows"
ON public.follows FOR ALL
TO authenticated
USING (auth.uid() = follower_id);

-- Shared items (published drills/plans)
CREATE TABLE public.shared_items (
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

CREATE POLICY "Public items viewable by all"
ON public.shared_items FOR SELECT
TO authenticated
USING (
  visibility = 'public' OR
  owner_user_id = auth.uid() OR
  (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM follows WHERE follower_id = auth.uid() AND followed_id = owner_user_id
  )) OR
  public.has_role(auth.uid(), 'platform_admin')
);

CREATE POLICY "Users can create own items"
ON public.shared_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_user_id);

CREATE POLICY "Users can update own items"
ON public.shared_items FOR UPDATE
TO authenticated
USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Users can delete own items"
ON public.shared_items FOR DELETE
TO authenticated
USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'platform_admin'));

-- Comments
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active comments"
ON public.comments FOR SELECT
TO authenticated
USING (status = 'active' OR user_id = auth.uid() OR public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'platform_admin'));

-- Reports
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  reporter_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'removed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_user_id);

CREATE POLICY "Admins can view reports"
ON public.reports FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Saves/Bookmarks
CREATE TABLE public.saved_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.saved_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own saves"
ON public.saved_items FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Likes
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.shared_items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, item_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes"
ON public.likes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage own likes"
ON public.likes FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Update timestamp trigger
CREATE TRIGGER update_coach_profiles_updated_at
BEFORE UPDATE ON public.coach_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shared_items_updated_at
BEFORE UPDATE ON public.shared_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_followed ON public.follows(followed_id);
CREATE INDEX idx_shared_items_owner ON public.shared_items(owner_user_id);
CREATE INDEX idx_shared_items_visibility ON public.shared_items(visibility);
CREATE INDEX idx_shared_items_status ON public.shared_items(status);
CREATE INDEX idx_shared_items_created ON public.shared_items(created_at DESC);
CREATE INDEX idx_comments_item ON public.comments(item_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_saved_items_user ON public.saved_items(user_id);
CREATE INDEX idx_likes_item ON public.likes(item_id);