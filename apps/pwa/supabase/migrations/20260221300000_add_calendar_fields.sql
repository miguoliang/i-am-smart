-- Migration: Add calendar subscription fields to accounts
-- Date: 2026-02-21
-- Description: calendar_token for authenticating .ics feed requests,
--   calendar_remind_hour for user-configurable daily reminder time.

ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS calendar_token uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS calendar_remind_hour int NOT NULL DEFAULT 9
  CHECK (calendar_remind_hour >= 0 AND calendar_remind_hour <= 23);

-- Backfill: ensure existing accounts get a token
UPDATE public.accounts SET calendar_token = gen_random_uuid() WHERE calendar_token IS NULL;

-- Make NOT NULL after backfill
ALTER TABLE public.accounts ALTER COLUMN calendar_token SET NOT NULL;

-- Index for token lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_accounts_calendar_token ON public.accounts(calendar_token);
