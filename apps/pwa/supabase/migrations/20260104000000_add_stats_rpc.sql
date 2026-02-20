-- Migration: Add Stats RPC functions
-- Date: 2026-01-04
-- Description: Adds RPC functions for efficient statistics calculation and timezone-aware heatmap generation

-- get_user_stats
CREATE OR REPLACE FUNCTION "public"."get_user_stats"(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_mastered int;
  v_learning int;
  v_due_today int;
BEGIN
  -- Total
  SELECT count(*) INTO v_total
  FROM account_cards
  WHERE account_id = p_user_id;

  -- Mastered (repetitions >= 7 AND interval_days >= 30)
  SELECT count(*) INTO v_mastered
  FROM account_cards
  WHERE account_id = p_user_id
    AND repetitions >= 7
    AND interval_days >= 30;

  -- Learning (repetitions > 0 AND interval_days < 30)
  SELECT count(*) INTO v_learning
  FROM account_cards
  WHERE account_id = p_user_id
    AND repetitions > 0
    AND interval_days < 30;

  -- Due Today (next_review_date <= now)
  SELECT count(*) INTO v_due_today
  FROM account_cards
  WHERE account_id = p_user_id
    AND next_review_date <= now();

  RETURN json_build_object(
    'total', v_total,
    'mastered', v_mastered,
    'learning', v_learning,
    'dueToday', v_due_today
  );
END;
$$;
ALTER FUNCTION "public"."get_user_stats"(uuid) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."get_user_stats"(uuid) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_stats"(uuid) TO "service_role";

-- get_review_heatmap
-- Returns daily review counts for the last 365 days (or custom limit), adjusted for user timezone
-- p_timezone_offset: The client's timezone offset in minutes (from JS getTimezoneOffset()). 
--                    Positive if behind UTC, negative if ahead.
--                    e.g. UTC+8 (China) is -480. UTC-5 (NY) is 300.
CREATE OR REPLACE FUNCTION "public"."get_review_heatmap"(p_user_id uuid, p_timezone_offset int)
RETURNS TABLE (
  review_date text,
  review_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(
      (reviewed_at - (p_timezone_offset || ' minutes')::interval), 
      'YYYY-MM-DD'
    ) as date_str,
    count(*) as count
  FROM review_history rh
  JOIN account_cards ac ON rh.account_card_id = ac.id
  WHERE ac.account_id = p_user_id
    -- Optimize: only look at last 60 days to cover the 30-day chart plus buffer
    AND rh.reviewed_at >= (now() - interval '60 days')
  GROUP BY 1
  ORDER BY 1;
END;
$$;
ALTER FUNCTION "public"."get_review_heatmap"(uuid, int) OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."get_review_heatmap"(uuid, int) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_review_heatmap"(uuid, int) TO "service_role";
