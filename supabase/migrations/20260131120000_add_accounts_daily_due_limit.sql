-- Add user-configurable daily due cards limit to accounts
-- Date: 2026-01-31

ALTER TABLE "public"."accounts"
  ADD COLUMN IF NOT EXISTS "daily_due_limit" integer NOT NULL DEFAULT 10
  CHECK (daily_due_limit >= 1 AND daily_due_limit <= 500);

COMMENT ON COLUMN "public"."accounts"."daily_due_limit" IS 'Max number of cards the user can review per day (1-500)';
