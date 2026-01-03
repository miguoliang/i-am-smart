-- Migration: Drop unused index on feedback content
-- Date: 2026-01-03
-- Description: Removes unused GIN index on jsonb column to improve write performance

DROP INDEX IF EXISTS "public"."idx_feedback_content";
