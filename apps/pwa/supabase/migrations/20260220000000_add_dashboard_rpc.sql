-- Migration: Add dashboard stats RPC for operator
-- Date: 2026-02-20
-- Description: Aggregated dashboard metrics for the operator panel.
--   Returns today's reviews, today's revenue, and 30-day trends in a single call.
--   Registration counts come from auth.users (handled in app code via admin API).

-- get_dashboard_review_trends: daily review counts for last N days
CREATE OR REPLACE FUNCTION public.get_dashboard_review_trends(
  p_tz_offset int,       -- timezone offset in minutes (JS getTimezoneOffset())
  p_days int DEFAULT 30  -- how many days to look back
)
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
      ac.updated_at - (p_tz_offset || ' minutes')::interval,
      'YYYY-MM-DD'
    ) AS review_date,
    count(*) AS review_count
  FROM account_cards ac
  WHERE ac.repetitions > 0
    AND ac.updated_at >= (now() - (p_days || ' days')::interval)
  GROUP BY 1
  ORDER BY 1;
END;
$$;

ALTER FUNCTION public.get_dashboard_review_trends(int, int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_review_trends(int, int) TO service_role;

-- get_dashboard_revenue_trends: daily paid revenue for last N days
CREATE OR REPLACE FUNCTION public.get_dashboard_revenue_trends(
  p_tz_offset int,
  p_days int DEFAULT 30
)
RETURNS TABLE (
  revenue_date text,
  revenue_amount bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_char(
      po.paid_at - (p_tz_offset || ' minutes')::interval,
      'YYYY-MM-DD'
    ) AS revenue_date,
    coalesce(sum(po.amount_total), 0)::bigint AS revenue_amount
  FROM pay_orders po
  WHERE po.status = 'paid'
    AND po.paid_at IS NOT NULL
    AND po.paid_at >= (now() - (p_days || ' days')::interval)
  GROUP BY 1
  ORDER BY 1;
END;
$$;

ALTER FUNCTION public.get_dashboard_revenue_trends(int, int) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.get_dashboard_revenue_trends(int, int) TO service_role;
