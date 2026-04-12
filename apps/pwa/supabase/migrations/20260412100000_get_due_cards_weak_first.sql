-- Due cards: prioritize "weaker" cards (lower SM-2 ease, more overdue, shorter interval) instead of random().
-- Order: ease_factor ASC (harder first) -> next_review_date ASC (more overdue first) ->
--         interval_days ASC (shorter interval = recently reset / more urgent) -> id (stable).

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
    AND (p_level IS NULL OR k.level = p_level)
  ORDER BY
    ac.ease_factor ASC NULLS LAST,
    ac.next_review_date ASC,
    ac.interval_days ASC,
    ac.id ASC
  LIMIT p_limit;
$$;
