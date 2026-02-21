-- Migration: Add level column to learner_profiles
-- Date: 2026-02-21
-- Description: Each learner profile stores its own level preference.
--   Previously level was stored client-side in localStorage.

ALTER TABLE public.learner_profiles
  ADD COLUMN IF NOT EXISTS level varchar(2) NOT NULL DEFAULT 'A1'
  CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'));
