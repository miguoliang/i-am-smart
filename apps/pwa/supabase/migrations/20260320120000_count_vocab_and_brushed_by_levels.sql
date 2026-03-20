-- Per-level totals and brushed counts (each CEFR band uses its own full total, not a delta).
-- Replaces aggregate-only count_vocab_and_brushed for exam progress UI.

CREATE OR REPLACE FUNCTION public.count_vocab_and_brushed_by_levels(
  p_profile_id uuid,
  p_levels text[]
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.learner_profiles lp
    WHERE lp.id = p_profile_id
      AND lp.account_id = (SELECT auth.uid())
  ) THEN
    RAISE EXCEPTION 'access denied' USING ERRCODE = '42501';
  END IF;

  IF p_levels IS NULL OR cardinality(p_levels) = 0 THEN
    RETURN '[]'::jsonb;
  END IF;

  RETURN COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'level', sub.level,
          'total', sub.total,
          'brushed', sub.brushed
        )
        ORDER BY sub.ord
      )
      FROM (
        SELECT
          u.lvl AS level,
          u.ord::int AS ord,
          (
            SELECT COUNT(*)::int
            FROM public.knowledge k
            WHERE k.metadata->>'level' = u.lvl
          ) AS total,
          (
            SELECT COUNT(DISTINCT ac.knowledge_code)::int
            FROM public.account_cards ac
            INNER JOIN public.knowledge k ON ac.knowledge_code = k.code
            WHERE ac.profile_id = p_profile_id
              AND k.metadata->>'level' = u.lvl
              AND ac.repetitions > 0
          ) AS brushed
        FROM unnest(p_levels) WITH ORDINALITY AS u(lvl, ord)
      ) sub
    ),
    '[]'::jsonb
  );
END;
$$;

ALTER FUNCTION public.count_vocab_and_brushed_by_levels(uuid, text[]) OWNER TO postgres;

REVOKE ALL ON FUNCTION public.count_vocab_and_brushed_by_levels(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_vocab_and_brushed_by_levels(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.count_vocab_and_brushed_by_levels(uuid, text[]) TO service_role;

DROP FUNCTION IF EXISTS public.count_vocab_and_brushed(uuid, text[]);
