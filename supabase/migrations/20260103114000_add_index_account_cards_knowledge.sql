-- Migration: Add index for knowledge_code foreign key on account_cards
-- Date: 2026-01-03
-- Description: Adds a covering index for the knowledge_code foreign key to improve query performance

CREATE INDEX IF NOT EXISTS "idx_account_cards_knowledge" ON "public"."account_cards" ("knowledge_code");
