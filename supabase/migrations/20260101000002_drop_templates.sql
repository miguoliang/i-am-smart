-- Migration to drop template related tables and functions

-- Drop the trigger that synced template codes (from sync_sequences.sql and add_triggers.sql)
DROP TRIGGER IF EXISTS "trigger_global_st_code_templates" ON "public"."templates";

-- Drop policies related to templates and card_type_templates (from add_template_rls.sql)
-- Note: Dropping the table automatically drops the policies attached to it.

-- Drop the card_type_templates table
DROP TABLE IF EXISTS "public"."card_type_templates";

-- Drop the templates table
DROP TABLE IF EXISTS "public"."templates";

-- Drop the sequence for card_type_templates (if not automatically dropped with the table)
DROP SEQUENCE IF EXISTS "public"."card_type_templates_id_seq";
