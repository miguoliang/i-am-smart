-- Migration: Fix multiple permissive policies on feedback table
-- Date: 2026-01-03

-- Drop conflicting policies (if they exist)
DROP POLICY IF EXISTS "Users can view their own feedback" ON "public"."feedback";
DROP POLICY IF EXISTS "Operators can view all feedback" ON "public"."feedback";

-- Create combined policy to avoid multiple permissive policies performance penalty
CREATE POLICY "Users and operators can view feedback" ON "public"."feedback"
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR 
  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'operator')
);
