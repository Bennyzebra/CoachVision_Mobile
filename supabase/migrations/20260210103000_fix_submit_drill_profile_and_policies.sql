-- Canonicalize coach_profiles identity + organization fields and ensure drills write policies exist.
-- Canonical choices:
--   * coach_profiles primary key/user linkage column: id
--   * coach_profiles organization column: organization

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coach_profiles'
      AND column_name = 'organization'
  ) THEN
    ALTER TABLE public.coach_profiles ADD COLUMN organization TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coach_profiles'
      AND column_name = 'org'
  ) THEN
    EXECUTE '
      UPDATE public.coach_profiles
      SET organization = COALESCE(organization, org)
      WHERE organization IS NULL AND org IS NOT NULL
    ';
  END IF;
END $$;

ALTER TABLE public.coach_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.coach_profiles;
CREATE POLICY "profiles_select_own" ON public.coach_profiles
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.coach_profiles;
CREATE POLICY "profiles_insert_own" ON public.coach_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.coach_profiles;
CREATE POLICY "profiles_update_own" ON public.coach_profiles
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- Ensure drills write operations are permitted for the owning coach under RLS.
DROP POLICY IF EXISTS "drills_insert_own" ON public.drills;
CREATE POLICY "drills_insert_own" ON public.drills
  FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "drills_update_own" ON public.drills;
CREATE POLICY "drills_update_own" ON public.drills
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = coach_id)
  WITH CHECK ((select auth.uid()) = coach_id);

DROP POLICY IF EXISTS "drills_delete_own" ON public.drills;
CREATE POLICY "drills_delete_own" ON public.drills
  FOR DELETE TO authenticated
  USING ((select auth.uid()) = coach_id);