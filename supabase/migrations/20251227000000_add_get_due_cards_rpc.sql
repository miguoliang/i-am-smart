CREATE OR REPLACE FUNCTION get_due_cards(p_user_id uuid, p_limit int)
RETURNS SETOF account_cards
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM account_cards
  WHERE account_id = p_user_id
  AND next_review_date <= now()
  ORDER BY random()
  LIMIT p_limit;
$$;
