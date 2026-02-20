-- Migration: Add daily review counts for accounts
-- Date: 2026-01-08
-- Description: Adds RPC function to get today's review counts for all accounts

-- get_accounts_daily_review_counts
-- Returns today's review count for all accounts
CREATE OR REPLACE FUNCTION "public"."get_accounts_daily_review_counts"()
RETURNS TABLE (
  account_id uuid,
  review_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.account_id,
    count(rh.id)::bigint as review_count
  FROM account_cards ac
  LEFT JOIN review_history rh ON rh.account_card_id = ac.id
    AND DATE(rh.reviewed_at) = CURRENT_DATE
  GROUP BY ac.account_id
  ORDER BY ac.account_id;
END;
$$;

ALTER FUNCTION "public"."get_accounts_daily_review_counts"() OWNER TO "postgres";
GRANT ALL ON FUNCTION "public"."get_accounts_daily_review_counts"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_accounts_daily_review_counts"() TO "service_role";