/*
  # Fix Profiles Table RLS Policies

  ## Problem
  The `profiles` table has RLS enabled but no policies applied, preventing
  the signup trigger from creating new profile records.

  ## Changes
  1. Add INSERT policy to allow authenticated users to create their own profile
  2. Add SELECT policy to allow users to view their own profile
  3. Add UPDATE policy to allow users to update their own profile

  ## Security
  - All policies check that auth.uid() matches the profile id
  - Only authenticated users can access profiles
  - Users can only access their own profile data
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Allow users to insert their own profile (used by signup trigger)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
