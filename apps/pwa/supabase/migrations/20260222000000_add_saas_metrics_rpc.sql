-- Migration: SaaS metrics RPCs for operator dashboard
-- Date: 2026-02-22
-- Description: WAU/MAU, cohort retention, churn rate, ARPPU

-- 1. get_dashboard_active_users: DAU/WAU/MAU counts for a given date
CREATE OR REPLACE FUNCTION public.get_dashboard_active_users(
  p_tz_offset int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_today_start timestamptz;
  v_week_start timestamptz;
  v_month_start timestamptz;
  v_dau bigint;
  v_wau bigint;
  v_mau bigint;
BEGIN
  -- Calculate local day boundaries
  v_today_start := date_trunc('day', v_now - (p_tz_offset || ' minutes')::interval)
                   + (p_tz_offset || ' minutes')::interval;
  v_week_start := v_today_start - interval '6 days';
  v_month_start := v_today_start - interval '29 days';

  -- DAU: distinct users active today
  SELECT count(DISTINCT ac.account_id) INTO v_dau
  FROM account_cards ac
  WHERE ac.last_reviewed_at >= v_today_start
    AND ac.last_reviewed_at < v_today_start + interval '1 day';

  -- WAU: distinct users active in last 7 days
  SELECT count(DISTINCT ac.account_id) INTO v_wau
  FROM account_cards ac
  WHERE ac.last_reviewed_at >= v_week_start
    AND ac.last_reviewed_at < v_today_start + interval '1 day';

  -- MAU: distinct users active in last 30 days
  SELECT count(DISTINCT ac.account_id) INTO v_mau
  FROM account_cards ac
  WHERE ac.last_reviewed_at >= v_month_start
    AND ac.last_reviewed_at < v_today_start + interval '1 day';

  RETURN json_build_object(
    'dau', v_dau,
    'wau', v_wau,
    'mau', v_mau,
    'dauMauRatio', CASE WHEN v_mau > 0
      THEN round((v_dau::numeric / v_mau * 100), 1)
      ELSE 0 END
  );
END;
$$;

ALTER FUNCTION public.get_dashboard_active_users(int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_active_users(int) TO service_role;


-- 2. get_dashboard_cohort_retention: registration-week cohorts with D1/D7/D30 retention
CREATE OR REPLACE FUNCTION public.get_dashboard_cohort_retention(
  p_tz_offset int,
  p_weeks int DEFAULT 8
)
RETURNS TABLE (
  cohort_week text,
  cohort_size bigint,
  d1_retention numeric,
  d7_retention numeric,
  d30_retention numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH user_reg AS (
    -- Get registration date for each user (from accounts.created_at)
    SELECT
      a.id AS user_id,
      date_trunc('week',
        (a.created_at - (p_tz_offset || ' minutes')::interval)
      )::date AS reg_week,
      (a.created_at - (p_tz_offset || ' minutes')::interval)::date AS reg_date
    FROM accounts a
    WHERE a.created_at >= now() - (p_weeks * 7 || ' days')::interval
  ),
  user_activity AS (
    -- Get distinct active dates per user
    SELECT
      ac.account_id AS user_id,
      (ac.last_reviewed_at - (p_tz_offset || ' minutes')::interval)::date AS active_date
    FROM account_cards ac
    WHERE ac.last_reviewed_at IS NOT NULL
      AND ac.last_reviewed_at >= now() - ((p_weeks * 7 + 30) || ' days')::interval
    GROUP BY ac.account_id,
      (ac.last_reviewed_at - (p_tz_offset || ' minutes')::interval)::date
  ),
  cohort_data AS (
    SELECT
      ur.reg_week,
      ur.user_id,
      ur.reg_date,
      -- Check if user was active on day N after registration
      EXISTS (
        SELECT 1 FROM user_activity ua
        WHERE ua.user_id = ur.user_id
          AND ua.active_date = ur.reg_date + 1
      ) AS retained_d1,
      EXISTS (
        SELECT 1 FROM user_activity ua
        WHERE ua.user_id = ur.user_id
          AND ua.active_date BETWEEN ur.reg_date + 2 AND ur.reg_date + 7
      ) AS retained_d7,
      EXISTS (
        SELECT 1 FROM user_activity ua
        WHERE ua.user_id = ur.user_id
          AND ua.active_date BETWEEN ur.reg_date + 8 AND ur.reg_date + 30
      ) AS retained_d30
    FROM user_reg ur
  )
  SELECT
    to_char(cd.reg_week, 'YYYY-MM-DD') AS cohort_week,
    count(DISTINCT cd.user_id) AS cohort_size,
    round(
      count(DISTINCT CASE WHEN cd.retained_d1 THEN cd.user_id END)::numeric
      / NULLIF(count(DISTINCT cd.user_id), 0) * 100, 1
    ) AS d1_retention,
    round(
      count(DISTINCT CASE WHEN cd.retained_d7 THEN cd.user_id END)::numeric
      / NULLIF(count(DISTINCT cd.user_id), 0) * 100, 1
    ) AS d7_retention,
    round(
      count(DISTINCT CASE WHEN cd.retained_d30 THEN cd.user_id END)::numeric
      / NULLIF(count(DISTINCT cd.user_id), 0) * 100, 1
    ) AS d30_retention
  FROM cohort_data cd
  GROUP BY cd.reg_week
  ORDER BY cd.reg_week;
END;
$$;

ALTER FUNCTION public.get_dashboard_cohort_retention(int, int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_cohort_retention(int, int) TO service_role;


-- 3. get_dashboard_churn: weekly and monthly churn rates
CREATE OR REPLACE FUNCTION public.get_dashboard_churn(
  p_tz_offset int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_today_start timestamptz;
  -- Weekly churn: active last week but not this week
  v_active_last_week bigint;
  v_churned_this_week bigint;
  -- Monthly churn: active last month but not this month
  v_active_last_month bigint;
  v_churned_this_month bigint;
BEGIN
  v_today_start := date_trunc('day', v_now - (p_tz_offset || ' minutes')::interval)
                   + (p_tz_offset || ' minutes')::interval;

  -- Users active 7-14 days ago
  SELECT count(DISTINCT account_id) INTO v_active_last_week
  FROM account_cards
  WHERE last_reviewed_at >= v_today_start - interval '14 days'
    AND last_reviewed_at < v_today_start - interval '7 days';

  -- Of those, how many were NOT active in last 7 days
  SELECT count(*) INTO v_churned_this_week
  FROM (
    SELECT DISTINCT account_id
    FROM account_cards
    WHERE last_reviewed_at >= v_today_start - interval '14 days'
      AND last_reviewed_at < v_today_start - interval '7 days'
    EXCEPT
    SELECT DISTINCT account_id
    FROM account_cards
    WHERE last_reviewed_at >= v_today_start - interval '7 days'
      AND last_reviewed_at < v_today_start + interval '1 day'
  ) churned;

  -- Users active 30-60 days ago
  SELECT count(DISTINCT account_id) INTO v_active_last_month
  FROM account_cards
  WHERE last_reviewed_at >= v_today_start - interval '60 days'
    AND last_reviewed_at < v_today_start - interval '30 days';

  -- Of those, how many were NOT active in last 30 days
  SELECT count(*) INTO v_churned_this_month
  FROM (
    SELECT DISTINCT account_id
    FROM account_cards
    WHERE last_reviewed_at >= v_today_start - interval '60 days'
      AND last_reviewed_at < v_today_start - interval '30 days'
    EXCEPT
    SELECT DISTINCT account_id
    FROM account_cards
    WHERE last_reviewed_at >= v_today_start - interval '30 days'
      AND last_reviewed_at < v_today_start + interval '1 day'
  ) churned;

  RETURN json_build_object(
    'weeklyChurnRate', CASE WHEN v_active_last_week > 0
      THEN round((v_churned_this_week::numeric / v_active_last_week * 100), 1)
      ELSE 0 END,
    'monthlyChurnRate', CASE WHEN v_active_last_month > 0
      THEN round((v_churned_this_month::numeric / v_active_last_month * 100), 1)
      ELSE 0 END,
    'weeklyActiveBase', v_active_last_week,
    'weeklyChurned', v_churned_this_week,
    'monthlyActiveBase', v_active_last_month,
    'monthlyChurned', v_churned_this_month
  );
END;
$$;

ALTER FUNCTION public.get_dashboard_churn(int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_churn(int) TO service_role;


-- 4. get_dashboard_arppu: average revenue per paying user
CREATE OR REPLACE FUNCTION public.get_dashboard_arppu(
  p_tz_offset int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total_revenue bigint;
  v_paying_users bigint;
  v_monthly_revenue bigint;
  v_monthly_paying bigint;
BEGIN
  -- All-time
  SELECT coalesce(sum(amount_total), 0), count(DISTINCT account_id)
  INTO v_total_revenue, v_paying_users
  FROM pay_orders
  WHERE status = 'paid';

  -- Last 30 days
  SELECT coalesce(sum(amount_total), 0), count(DISTINCT account_id)
  INTO v_monthly_revenue, v_monthly_paying
  FROM pay_orders
  WHERE status = 'paid'
    AND paid_at >= now() - interval '30 days';

  RETURN json_build_object(
    'totalRevenue', v_total_revenue,
    'payingUsers', v_paying_users,
    'arppu', CASE WHEN v_paying_users > 0
      THEN round((v_total_revenue::numeric / v_paying_users), 0)
      ELSE 0 END,
    'monthlyRevenue', v_monthly_revenue,
    'monthlyPayingUsers', v_monthly_paying,
    'monthlyArppu', CASE WHEN v_monthly_paying > 0
      THEN round((v_monthly_revenue::numeric / v_monthly_paying), 0)
      ELSE 0 END
  );
END;
$$;

ALTER FUNCTION public.get_dashboard_arppu(int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_arppu(int) TO service_role;
