-- Add editable/history metadata for practice tracker support.
ALTER TABLE public.practices
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS scheduled_date timestamptz,
  ADD COLUMN IF NOT EXISTS notes text;

CREATE INDEX IF NOT EXISTS idx_practices_scheduled_date ON public.practices (scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_practices_title ON public.practices (title);

-- Ensure owner-only RLS policies exist for read/write tracker operations.
ALTER TABLE public.practices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practices'
      AND policyname = 'practices_select_own'
  ) THEN
    CREATE POLICY "practices_select_own" ON public.practices
      FOR SELECT USING (coach_id = (select auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practices'
      AND policyname = 'practices_insert_own'
  ) THEN
    CREATE POLICY "practices_insert_own" ON public.practices
      FOR INSERT WITH CHECK (coach_id = (select auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'practices'
      AND policyname = 'practices_update_own'
  ) THEN
    CREATE POLICY "practices_update_own" ON public.practices
      FOR UPDATE USING (coach_id = (select auth.uid()));
  END IF;
END $$;