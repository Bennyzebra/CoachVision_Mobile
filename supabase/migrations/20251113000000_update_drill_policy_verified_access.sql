-- Allow authenticated coaches to view verified drills from any coach
-- Expands discoverability of community-verified drills while
-- preserving ownership protections for private content.

-- Update SELECT policy on public.drills to include verified drills
DROP POLICY IF EXISTS "Coaches can view own and template drills" ON public.drills;
CREATE POLICY "Coaches can view own, template, and verified drills"
  ON public.drills FOR SELECT
  TO authenticated
  USING (auth.uid() = coach_id OR is_template = true OR verified = true);