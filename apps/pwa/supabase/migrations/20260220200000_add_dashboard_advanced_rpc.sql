-- Migration: Add dashboard advanced metrics RPCs
-- Date: 2026-02-20
-- Description: DAU (daily active users), retention rates, paid conversion rate

-- get_dashboard_dau: daily active users (users who reviewed at least 1 card) for last N days
CREATE OR REPLACE FUNCTION public.get_dashboard_dau(
  p_tz_offset int,
  p_days int DEFAULT 30
)
RETURNS TABLE (
  active_date text,
  active_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(
      ac.updated_at - (p_tz_offset || ' minutes')::interval,
      'YYYY-MM-DD'
    ) AS active_date,
    count(DISTINCT ac.account_id) AS active_users
  FROM account_cards ac
  WHERE ac.repetitions > 0
    AND ac.updated_at >= (now() - (p_days || ' days')::interval)
  GROUP BY 1
  ORDER BY 1;
END;
$$;

ALTER FUNCTION public.get_dashboard_dau(int, int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_dau(int, int) TO service_role;

-- get_retention_stats: next-day and 7-day retention
-- Returns: { next_day_retention: float, seven_day_retention: float, paid_conversion: float }
CREATE OR REPLACE FUNCTION public.get_dashboard_retention(
  p_tz_offset int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_users bigint;
  v_next_day bigint;
  v_seven_day bigint;
  v_paid_users bigint;
  v_next_day_rate float;
  v_seven_day_rate float;
  v_paid_rate float;
BEGIN
  -- Total users who have at least 1 card (i.e. activated)
  SELECT count(DISTINCT account_id) INTO v_total_users
  FROM account_cards;

  IF v_total_users = 0 THEN
    RETURN json_build_object(
      'nextDayRetention', 0,
      'sevenDayRetention', 0,
      'paidConversion', 0,
      'totalActivatedUsers', 0
    );
  END IF;

  -- Next-day retention: users who reviewed on 2+ distinct days
  SELECT count(DISTINCT account_id) INTO v_next_day
  FROM (
    SELECT account_id,
      count(DISTINCT to_char(updated_at - (p_tz_offset || ' minutes')::interval, 'YYYY-MM-DD')) AS day_count
    FROM account_cards
    WHERE repetitions > 0
    GROUP BY account_id
    HAVING count(DISTINCT to_char(updated_at - (p_tz_offset || ' minutes')::interval, 'YYYY-MM-DD')) >= 2
  ) sub;

  -- 7-day retention: users who reviewed on 7+ distinct days
  SELECT count(DISTINCT account_id) INTO v_seven_day
  FROM (
    SELECT account_id,
      count(DISTINCT to_char(updated_at - (p_tz_offset || ' minutes')::interval, 'YYYY-MM-DD')) AS day_count
    FROM account_cards
    WHERE repetitions > 0
    GROUP BY account_id
    HAVING count(DISTINCT to_char(updated_at - (p_tz_offset || ' minutes')::interval, 'YYYY-MM-DD')) >= 7
  ) sub;

  -- Paid conversion: users with at least 1 paid order
  SELECT count(DISTINCT account_id) INTO v_paid_users
  FROM pay_orders
  WHERE status = 'paid';

  v_next_day_rate := round((v_next_day::float / v_total_users * 100)::numeric, 1);
  v_seven_day_rate := round((v_seven_day::float / v_total_users * 100)::numeric, 1);
  v_paid_rate := round((v_paid_users::float / v_total_users * 100)::numeric, 1);

  RETURN json_build_object(
    'nextDayRetention', v_next_day_rate,
    'sevenDayRetention', v_seven_day_rate,
    'paidConversion', v_paid_rate,
    'totalActivatedUsers', v_total_users
  );
END;
$$;

ALTER FUNCTION public.get_dashboard_retention(int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_retention(int) TO service_role;
