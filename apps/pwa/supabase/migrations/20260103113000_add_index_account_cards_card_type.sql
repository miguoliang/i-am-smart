-- Migration: Add index for card_type_code foreign key on account_cards
-- Date: 2026-01-03
-- Description: Adds a covering index for the card_type_code foreign key to improve query performance

CREATE INDEX IF NOT EXISTS "idx_account_cards_card_type" ON "public"."account_cards" ("card_type_code");
