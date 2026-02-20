-- Migration: Update get_due_cards to support level filtering
-- Date: 2026-01-04
-- Description: Updates the get_due_cards RPC to filter by knowledge level at the database layer

CREATE OR REPLACE FUNCTION "public"."get_due_cards"(p_user_id uuid, p_limit int, p_level text DEFAULT NULL)
RETURNS SETOF "public"."account_cards"
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ac.*
  FROM account_cards ac
  JOIN knowledge k ON ac.knowledge_code = k.code
  WHERE ac.account_id = p_user_id
  AND ac.next_review_date <= now()
  AND (p_level IS NULL OR k.metadata->>'level' = p_level)
  ORDER BY random()
  LIMIT p_limit;
$$;

GRANT ALL ON FUNCTION "public"."get_due_cards"(uuid, int, text) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_due_cards"(uuid, int, text) TO "service_role";
