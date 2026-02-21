-- Migration: Add MRR, NRR, LTV metrics RPCs
-- Date: 2026-02-22
-- Description: Subscription-oriented metrics based on pay_orders

-- 1. get_dashboard_mrr: Monthly Recurring Revenue (approximated from pay_orders)
CREATE OR REPLACE FUNCTION public.get_dashboard_mrr(
  p_tz_offset int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_this_month_start timestamptz;
  v_last_month_start timestamptz;
  v_this_month_revenue bigint;
  v_last_month_revenue bigint;
  v_mom_growth numeric;
BEGIN
  -- Calculate month boundaries in user's timezone
  v_this_month_start := date_trunc('month',
    v_now - (p_tz_offset || ' minutes')::interval
  ) + (p_tz_offset || ' minutes')::interval;

  v_last_month_start := v_this_month_start - interval '1 month';

  -- This month's revenue
  SELECT coalesce(sum(amount_total), 0) INTO v_this_month_revenue
  FROM pay_orders
  WHERE status = 'paid'
    AND paid_at >= v_this_month_start
    AND paid_at < v_this_month_start + interval '1 month';

  -- Last month's revenue
  SELECT coalesce(sum(amount_total), 0) INTO v_last_month_revenue
  FROM pay_orders
  WHERE status = 'paid'
    AND paid_at >= v_last_month_start
    AND paid_at < v_this_month_start;

  -- Month-over-month growth
  v_mom_growth := CASE WHEN v_last_month_revenue > 0
    THEN round(((v_this_month_revenue - v_last_month_revenue)::numeric / v_last_month_revenue * 100), 1)
    ELSE CASE WHEN v_this_month_revenue > 0 THEN 100 ELSE 0 END
  END;

  RETURN json_build_object(
    'currentMrr', v_this_month_revenue,
    'lastMrr', v_last_month_revenue,
    'momGrowth', v_mom_growth
  );
END;
$$;

ALTER FUNCTION public.get_dashboard_mrr(int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_mrr(int) TO service_role;


-- 2. get_dashboard_nrr: Net Revenue Retention
-- Tracks revenue from the same cohort of paying users month-over-month
CREATE OR REPLACE FUNCTION public.get_dashboard_nrr(
  p_tz_offset int
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamptz := now();
  v_this_month_start timestamptz;
  v_last_month_start timestamptz;
  v_cohort_last_month bigint;
  v_cohort_this_month bigint;
  v_nrr numeric;
BEGIN
  v_this_month_start := date_trunc('month',
    v_now - (p_tz_offset || ' minutes')::interval
  ) + (p_tz_offset || ' minutes')::interval;

  v_last_month_start := v_this_month_start - interval '1 month';

  -- Revenue from users who paid last month (their last-month total)
  SELECT coalesce(sum(amount_total), 0) INTO v_cohort_last_month
  FROM pay_orders
  WHERE status = 'paid'
    AND paid_at >= v_last_month_start
    AND paid_at < v_this_month_start
    AND account_id IN (
      SELECT DISTINCT account_id FROM pay_orders
      WHERE status = 'paid'
        AND paid_at >= v_last_month_start
        AND paid_at < v_this_month_start
    );

  -- Revenue from those SAME users this month
  SELECT coalesce(sum(amount_total), 0) INTO v_cohort_this_month
  FROM pay_orders
  WHERE status = 'paid'
    AND paid_at >= v_this_month_start
    AND paid_at < v_this_month_start + interval '1 month'
    AND account_id IN (
      SELECT DISTINCT account_id FROM pay_orders
      WHERE status = 'paid'
        AND paid_at >= v_last_month_start
        AND paid_at < v_this_month_start
    );

  v_nrr := CASE WHEN v_cohort_last_month > 0
    THEN round((v_cohort_this_month::numeric / v_cohort_last_month * 100), 1)
    ELSE 0
  END;

  RETURN json_build_object(
    'nrr', v_nrr,
    'cohortLastMonth', v_cohort_last_month,
    'cohortThisMonth', v_cohort_this_month
  );
END;
$$;

ALTER FUNCTION public.get_dashboard_nrr(int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_nrr(int) TO service_role;


-- 3. get_dashboard_ltv: Lifetime Value (simple formula: ARPPU / monthly churn rate)
CREATE OR REPLACE FUNCTION public.get_dashboard_ltv(
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
  v_total_revenue bigint;
  v_paying_users bigint;
  v_arppu numeric;
  v_active_last_month bigint;
  v_churned_this_month bigint;
  v_monthly_churn_rate numeric;
  v_ltv numeric;
BEGIN
  v_today_start := date_trunc('day', v_now - (p_tz_offset || ' minutes')::interval)
                   + (p_tz_offset || ' minutes')::interval;

  -- ARPPU
  SELECT coalesce(sum(amount_total), 0), count(DISTINCT account_id)
  INTO v_total_revenue, v_paying_users
  FROM pay_orders WHERE status = 'paid';

  v_arppu := CASE WHEN v_paying_users > 0
    THEN v_total_revenue::numeric / v_paying_users
    ELSE 0 END;

  -- Monthly churn (same logic as get_dashboard_churn)
  SELECT count(DISTINCT account_id) INTO v_active_last_month
  FROM account_cards
  WHERE last_reviewed_at >= v_today_start - interval '60 days'
    AND last_reviewed_at < v_today_start - interval '30 days';

  SELECT count(*) INTO v_churned_this_month
  FROM (
    SELECT DISTINCT account_id FROM account_cards
    WHERE last_reviewed_at >= v_today_start - interval '60 days'
      AND last_reviewed_at < v_today_start - interval '30 days'
    EXCEPT
    SELECT DISTINCT account_id FROM account_cards
    WHERE last_reviewed_at >= v_today_start - interval '30 days'
      AND last_reviewed_at < v_today_start + interval '1 day'
  ) churned;

  v_monthly_churn_rate := CASE WHEN v_active_last_month > 0
    THEN v_churned_this_month::numeric / v_active_last_month
    ELSE 0 END;

  -- LTV = ARPPU / monthly churn rate
  v_ltv := CASE WHEN v_monthly_churn_rate > 0
    THEN round(v_arppu / v_monthly_churn_rate, 0)
    ELSE 0 END;

  RETURN json_build_object(
    'ltv', v_ltv,
    'arppu', round(v_arppu, 0),
    'monthlyChurnRate', round(v_monthly_churn_rate * 100, 1)
  );
END;
$$;

ALTER FUNCTION public.get_dashboard_ltv(int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_ltv(int) TO service_role;
