-- Fix knowledge SELECT RLS policy to ensure users can read knowledge
-- This is needed for joins when fetching cards with knowledge data
--
-- Issue: When fetching cards via RPC function and joining with knowledge,
-- the join query runs with user permissions, so RLS applies to knowledge table.
-- The SELECT policy must allow all authenticated users to read knowledge.

-- Drop existing SELECT policy if it exists
DROP POLICY IF EXISTS "Enable read access for all users" ON public.knowledge;

-- Re-create SELECT policy to ensure all authenticated users can read knowledge
-- This is necessary for learners to see knowledge when fetching their cards
-- The policy uses USING (true) which allows all authenticated users to read
CREATE POLICY "Enable read access for all users" ON public.knowledge
FOR SELECT USING (true);

-- Verify RLS is enabled (should already be enabled, but ensure it)
ALTER TABLE public.knowledge ENABLE ROW LEVEL SECURITY;

-- Note: The policy uses USING (true) which allows all authenticated users to read
-- This is safe because knowledge items are public learning content, not user-specific data
-- Users can only modify knowledge if they are operators (enforced by INSERT/UPDATE/DELETE policies)

