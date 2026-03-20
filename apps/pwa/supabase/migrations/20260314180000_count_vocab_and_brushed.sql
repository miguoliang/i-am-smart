-- Per-profile vocab totals by CEFR levels and "brushed" count (distinct knowledge with repetitions > 0).
-- Used for exam-target progress x/y in settings.

CREATE OR REPLACE FUNCTION public.count_vocab_and_brushed(
  p_profile_id uuid,
  p_levels text[]
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total int;
  v_brushed int;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.learner_profiles lp
    WHERE lp.id = p_profile_id
      AND lp.account_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  SELECT COUNT(*)::int INTO v_total
  FROM public.knowledge k
  WHERE k.metadata->>'level' = ANY(p_levels);

  SELECT COUNT(DISTINCT ac.knowledge_code)::int INTO v_brushed
  FROM public.account_cards ac
  INNER JOIN public.knowledge k ON ac.knowledge_code = k.code
  WHERE ac.profile_id = p_profile_id
    AND k.metadata->>'level' = ANY(p_levels)
    AND ac.repetitions > 0;

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'brushed', COALESCE(v_brushed, 0)
  );
END;
$$;

ALTER FUNCTION public.count_vocab_and_brushed(uuid, text[]) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.count_vocab_and_brushed(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_vocab_and_brushed(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_vocab_and_brushed(uuid, text[]) TO service_role;
