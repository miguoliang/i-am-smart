-- Migration: Add index for user_id foreign key on push_subscriptions
-- Date: 2026-01-03
-- Description: Adds a covering index for the user_id foreign key to improve query performance

CREATE INDEX IF NOT EXISTS "idx_push_subscriptions_user" ON "public"."push_subscriptions" ("user_id");
