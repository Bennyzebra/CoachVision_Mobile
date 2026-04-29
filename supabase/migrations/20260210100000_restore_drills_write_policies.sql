-- Restore drills write policies so authenticated coaches can submit and manage their own drills.
-- A prior policy consolidation left the drills table with only a SELECT policy in some environments,
-- which causes INSERT/UPDATE/DELETE operations to fail under RLS.

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