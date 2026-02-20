-- Migration: Add status and operator_note to feedbacks
-- Date: 2026-02-20
-- Description: Allow operators to mark feedback as resolved and add notes

ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  ADD COLUMN IF NOT EXISTS operator_note text;

CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
