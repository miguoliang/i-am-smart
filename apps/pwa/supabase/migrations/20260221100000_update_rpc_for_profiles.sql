-- Migration: Update RPC functions for profile-based queries
-- Date: 2026-02-21
-- Description: All learning RPCs now accept profile_id instead of user_id.
--   Old function signatures are kept as wrappers for backward compatibility
--   during the transition period.

-- 1. get_due_cards — new profile-based version
CREATE OR REPLACE FUNCTION public.get_due_cards_by_profile(
  p_profile_id uuid,
  p_limit int,
  p_level text DEFAULT NULL
)
RETURNS SETOF public.account_cards
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ac.*
  FROM account_cards ac
  JOIN knowledge k ON ac.knowledge_code = k.code
  WHERE ac.profile_id = p_profile_id
    AND ac.next_review_date <= now()
    AND (p_level IS NULL OR k.metadata->>'level' = p_level)
  ORDER BY random()
  LIMIT p_limit;
$$;

GRANT ALL ON FUNCTION public.get_due_cards_by_profile(uuid, int, text) TO authenticated;
GRANT ALL ON FUNCTION public.get_due_cards_by_profile(uuid, int, text) TO service_role;

-- 2. review_card — new profile-based version
CREATE OR REPLACE FUNCTION public.review_card_by_profile(
  p_card_id bigint,
  p_profile_id uuid,
  p_quality integer,
  p_ease_factor numeric,
  p_interval_days integer,
  p_repetitions integer,
  p_next_review_date timestamp with time zone
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows_affected int;
BEGIN
  UPDATE public.account_cards
  SET
    ease_factor = p_ease_factor,
    interval_days = p_interval_days,
    repetitions = p_repetitions,
    next_review_date = p_next_review_date,
    last_reviewed_at = now(),
    updated_at = now()
  WHERE id = p_card_id AND profile_id = p_profile_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Card not found or access denied';
  END IF;

  INSERT INTO public.review_history (account_card_id, quality, reviewed_at)
  VALUES (p_card_id, p_quality, now());
END;
$$;

GRANT ALL ON FUNCTION public.review_card_by_profile(bigint, uuid, integer, numeric, integer, integer, timestamptz) TO authenticated;
GRANT ALL ON FUNCTION public.review_card_by_profile(bigint, uuid, integer, numeric, integer, integer, timestamptz) TO service_role;

-- 3. get_user_stats — new profile-based version
CREATE OR REPLACE FUNCTION public.get_profile_stats(p_profile_id uuid)
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
  SELECT count(*) INTO v_total
  FROM account_cards WHERE profile_id = p_profile_id;

  SELECT count(*) INTO v_mastered
  FROM account_cards
  WHERE profile_id = p_profile_id
    AND repetitions >= 7 AND interval_days >= 30;

  SELECT count(*) INTO v_learning
  FROM account_cards
  WHERE profile_id = p_profile_id
    AND repetitions > 0 AND interval_days < 30;

  SELECT count(*) INTO v_due_today
  FROM account_cards
  WHERE profile_id = p_profile_id
    AND next_review_date <= now();

  RETURN json_build_object(
    'total', v_total,
    'mastered', v_mastered,
    'learning', v_learning,
    'dueToday', v_due_today
  );
END;
$$;

GRANT ALL ON FUNCTION public.get_profile_stats(uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_profile_stats(uuid) TO service_role;

-- 4. get_review_heatmap — new profile-based version
CREATE OR REPLACE FUNCTION public.get_profile_review_heatmap(
  p_profile_id uuid,
  p_timezone_offset int
)
RETURNS TABLE (review_date text, review_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(
      (rh.reviewed_at - (p_timezone_offset || ' minutes')::interval),
      'YYYY-MM-DD'
    ) as date_str,
    count(*) as count
  FROM review_history rh
  JOIN account_cards ac ON rh.account_card_id = ac.id
  WHERE ac.profile_id = p_profile_id
    AND rh.reviewed_at >= (now() - interval '60 days')
  GROUP BY 1
  ORDER BY 1;
END;
$$;

GRANT ALL ON FUNCTION public.get_profile_review_heatmap(uuid, int) TO authenticated;
GRANT ALL ON FUNCTION public.get_profile_review_heatmap(uuid, int) TO service_role;

-- 5. distribute_all_cards — update to use profile_id
CREATE OR REPLACE FUNCTION public.distribute_all_cards_to_profile(
  p_profile_id uuid,
  p_account_id uuid,
  p_card_type_code text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted int;
  v_total int;
BEGIN
  SELECT count(*) INTO v_total FROM public.knowledge;

  INSERT INTO public.account_cards (
    account_id, profile_id, knowledge_code, card_type_code,
    ease_factor, interval_days, repetitions, next_review_date
  )
  SELECT
    p_account_id,
    p_profile_id,
    k.code,
    p_card_type_code,
    2.50, 0, 0, now()
  FROM public.knowledge k
  ON CONFLICT (profile_id, knowledge_code, card_type_code) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object(
    'inserted', v_inserted,
    'skipped', v_total - v_inserted
  );
END;
$$;

GRANT ALL ON FUNCTION public.distribute_all_cards_to_profile(uuid, uuid, text) TO authenticated;
GRANT ALL ON FUNCTION public.distribute_all_cards_to_profile(uuid, uuid, text) TO service_role;
