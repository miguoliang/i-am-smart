-- Harden RPC authorization for SECURITY DEFINER functions.
--
-- SECURITY DEFINER functions bypass RLS, so every user-supplied account/profile
-- parameter must be tied back to auth.uid(). Operator/global metrics are only
-- called through server-side admin clients and should not be executable from
-- browser Supabase clients.

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
    AND (
      (SELECT auth.role()) = 'service_role'
      OR EXISTS (
        SELECT 1
        FROM public.learner_profiles lp
        WHERE lp.id = p_profile_id
          AND lp.account_id = (SELECT auth.uid())
      )
    )
    AND ac.next_review_date <= now()
    AND (p_level IS NULL OR k.level = p_level)
  ORDER BY
    ac.ease_factor ASC NULLS LAST,
    ac.next_review_date ASC,
    ac.interval_days ASC,
    ac.id ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 0), 0), 10000);
$$;

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
  IF NOT (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.learner_profiles lp
      WHERE lp.id = p_profile_id
        AND lp.account_id = (SELECT auth.uid())
    )
  ) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

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
  IF NOT (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.learner_profiles lp
      WHERE lp.id = p_profile_id
        AND lp.account_id = (SELECT auth.uid())
    )
  ) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

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
  IF NOT (
    (SELECT auth.role()) = 'service_role'
    OR EXISTS (
      SELECT 1
      FROM public.learner_profiles lp
      WHERE lp.id = p_profile_id
        AND lp.account_id = (SELECT auth.uid())
    )
  ) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

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
  IF NOT (
    (SELECT auth.role()) = 'service_role'
    OR (
      p_account_id = (SELECT auth.uid())
      AND EXISTS (
        SELECT 1
        FROM public.learner_profiles lp
        WHERE lp.id = p_profile_id
          AND lp.account_id = p_account_id
      )
    )
  ) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_total FROM public.knowledge;

  INSERT INTO public.account_cards (
    account_id, profile_id, knowledge_code, card_type_code,
    ease_factor, interval_days, repetitions, next_review_date,
    created_at, updated_at
  )
  SELECT
    p_account_id, p_profile_id, k.code, p_card_type_code,
    2.50, 0, 0, now(), now(), now()
  FROM public.knowledge k
  ON CONFLICT (profile_id, knowledge_code, card_type_code) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object('inserted', v_inserted, 'skipped', v_total - v_inserted);
END;
$$;

-- Legacy account-based learner RPCs: keep owner access for compatibility, but
-- prevent cross-account calls now that these functions run as SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.get_due_cards(p_user_id uuid, p_limit int, p_level text DEFAULT NULL)
RETURNS SETOF public.account_cards
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ac.*
  FROM account_cards ac
  JOIN knowledge k ON ac.knowledge_code = k.code
  WHERE ac.account_id = p_user_id
    AND ((SELECT auth.role()) = 'service_role' OR p_user_id = (SELECT auth.uid()))
    AND ac.next_review_date <= now()
    AND (p_level IS NULL OR k.level = p_level)
  ORDER BY
    ac.ease_factor ASC NULLS LAST,
    ac.next_review_date ASC,
    ac.interval_days ASC,
    ac.id ASC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 0), 0), 10000);
$$;

CREATE OR REPLACE FUNCTION public.review_card(
  p_card_id bigint,
  p_user_id uuid,
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
  IF NOT ((SELECT auth.role()) = 'service_role' OR p_user_id = (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  UPDATE public.account_cards
  SET
    ease_factor = p_ease_factor,
    interval_days = p_interval_days,
    repetitions = p_repetitions,
    next_review_date = p_next_review_date,
    last_reviewed_at = now(),
    updated_at = now()
  WHERE id = p_card_id and account_id = p_user_id;

  GET DIAGNOSTICS v_rows_affected = ROW_COUNT;

  IF v_rows_affected = 0 THEN
    RAISE EXCEPTION 'Card not found or access denied';
  END IF;

  INSERT INTO public.review_history (account_card_id, quality, reviewed_at)
  VALUES (p_card_id, p_quality, now());
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid)
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
  IF NOT ((SELECT auth.role()) = 'service_role' OR p_user_id = (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_total FROM account_cards WHERE account_id = p_user_id;
  SELECT count(*) INTO v_mastered FROM account_cards WHERE account_id = p_user_id AND repetitions >= 7 AND interval_days >= 30;
  SELECT count(*) INTO v_learning FROM account_cards WHERE account_id = p_user_id AND repetitions > 0 AND interval_days < 30;
  SELECT count(*) INTO v_due_today FROM account_cards WHERE account_id = p_user_id AND next_review_date <= now();

  RETURN json_build_object(
    'total', v_total,
    'mastered', v_mastered,
    'learning', v_learning,
    'dueToday', v_due_today
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_review_heatmap(p_user_id uuid, p_timezone_offset int)
RETURNS TABLE (review_date text, review_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT ((SELECT auth.role()) = 'service_role' OR p_user_id = (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    to_char((reviewed_at - (p_timezone_offset || ' minutes')::interval), 'YYYY-MM-DD') as date_str,
    count(*) as count
  FROM review_history rh
  JOIN account_cards ac ON rh.account_card_id = ac.id
  WHERE ac.account_id = p_user_id
    AND rh.reviewed_at >= (now() - interval '60 days')
  GROUP BY 1
  ORDER BY 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.distribute_all_cards(p_user_id uuid, p_card_type_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inserted_count int;
  v_total_knowledge int;
BEGIN
  IF NOT ((SELECT auth.role()) = 'service_role' OR p_user_id = (SELECT auth.uid())) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_total_knowledge FROM knowledge;

  WITH inserted AS (
    INSERT INTO public.account_cards (
      account_id,
      knowledge_code,
      card_type_code,
      ease_factor,
      interval_days,
      repetitions,
      next_review_date,
      created_at,
      updated_at
    )
    SELECT
      p_user_id,
      k.code,
      p_card_type_code,
      2.50,
      0,
      0,
      now(),
      now(),
      now()
    FROM public.knowledge k
    ON CONFLICT (account_id, knowledge_code, card_type_code) DO NOTHING
    RETURNING id
  )
  SELECT count(*) INTO v_inserted_count FROM inserted;

  RETURN json_build_object(
    'inserted', v_inserted_count,
    'skipped', v_total_knowledge - v_inserted_count
  );
END;
$$;

-- Explicit grants for learner-facing RPCs.
REVOKE ALL ON FUNCTION public.get_due_cards_by_profile(uuid, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_due_cards_by_profile(uuid, int, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.review_card_by_profile(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_card_by_profile(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_profile_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_stats(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_profile_review_heatmap(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_profile_review_heatmap(uuid, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.distribute_all_cards_to_profile(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.distribute_all_cards_to_profile(uuid, uuid, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_due_cards(uuid, int, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_due_cards(uuid, int, text) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.review_card(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_card(bigint, uuid, integer, numeric, integer, integer, timestamp with time zone) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_user_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.get_review_heatmap(uuid, int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_review_heatmap(uuid, int) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.distribute_all_cards(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.distribute_all_cards(uuid, text) TO authenticated, service_role;

-- Global/operator-only RPCs must only be invoked through server-side admin clients.
REVOKE ALL ON FUNCTION public.get_accounts_daily_review_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_accounts_daily_review_counts() TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_review_trends(int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_review_trends(int, int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_revenue_trends(int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_revenue_trends(int, int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_active_users(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_active_users(int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_cohort_retention(int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_cohort_retention(int, int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_churn(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_churn(int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_arppu(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_arppu(int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_mrr(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_mrr(int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_nrr(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_nrr(int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_ltv(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_ltv(int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_dau(int, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_dau(int, int) TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_retention(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_retention(int) TO service_role;

REVOKE ALL ON FUNCTION public.get_completion_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_completion_metrics() TO service_role;

REVOKE ALL ON FUNCTION public.get_referral_metrics() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_referral_metrics() TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_nps() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_nps() TO service_role;

REVOKE ALL ON FUNCTION public.get_dashboard_kfactor() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kfactor() TO service_role;
