-- Ensure operators can read knowledge
-- This migration verifies and ensures the SELECT policy works correctly
--
-- Issue: Operators cannot see knowledge items, likely due to RLS policy not working correctly
-- Solution: Ensure the SELECT policy is correct and add explicit operator policy as backup

-- Drop all existing SELECT policies to start fresh
DROP POLICY IF EXISTS "Enable read access for all users" ON public.knowledge;
DROP POLICY IF EXISTS "Enable read access for operators" ON public.knowledge;

-- Re-create the general SELECT policy that allows all authenticated users
-- This uses USING (true) which should allow everyone, but we'll also add explicit operator policy
CREATE POLICY "Enable read access for all users" ON public.knowledge
FOR SELECT USING (true);

-- Add explicit operator policy as backup (multiple SELECT policies use OR logic)
-- This ensures operators can definitely read even if there are any edge cases with the general policy
CREATE POLICY "Enable read access for operators" ON public.knowledge
FOR SELECT USING (
  ((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator'
);

-- Verify RLS is enabled
ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;

-- Note: PostgreSQL RLS combines multiple SELECT policies with OR logic
-- So having both policies means:
-- - All authenticated users can read (from "Enable read access for all users" with USING (true))
-- - Operators explicitly can read (from "Enable read access for operators")
-- This ensures operators can definitely read knowledge even if there are any issues with the general policy

