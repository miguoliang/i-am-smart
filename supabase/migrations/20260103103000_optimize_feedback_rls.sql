-- Migration: Optimize feedback RLS policy performance
-- Date: 2026-01-03
-- Description: Wrap auth functions in subqueries to prevent per-row evaluation

-- Drop the unoptimized policy
DROP POLICY IF EXISTS "Users and operators can view feedback" ON "public"."feedback";

-- Recreate with optimized auth calls
CREATE POLICY "Users and operators can view feedback" ON "public"."feedback"
FOR SELECT
USING (
  ((select auth.uid()) = user_id) 
  OR 
  (((select auth.jwt()) -> 'app_metadata' ->> 'role') = 'operator')
);
