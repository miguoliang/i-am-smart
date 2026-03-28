-- Denormalize pos, level, self_examine_prompt, theme from metadata into columns + indexes.
-- New inserts that still only set metadata are synced via trigger.

ALTER TABLE public.knowledge
  ADD COLUMN IF NOT EXISTS pos text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS level text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS self_examine_prompt text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT '';

UPDATE public.knowledge
SET
  pos = COALESCE(metadata->>'pos', ''),
  level = COALESCE(metadata->>'level', ''),
  self_examine_prompt = COALESCE(metadata->>'selfExaminePrompt', ''),
  theme = COALESCE(metadata->>'theme', '');

UPDATE public.knowledge
SET metadata = metadata - 'pos' - 'level' - 'selfExaminePrompt' - 'theme';

COMMENT ON COLUMN public.knowledge.pos IS 'Part of speech (e.g. n., v.)';
COMMENT ON COLUMN public.knowledge.level IS 'CEFR band (e.g. A1, B2)';
COMMENT ON COLUMN public.knowledge.self_examine_prompt IS 'Self-check prompt for the learner';
COMMENT ON COLUMN public.knowledge.theme IS 'Topic/theme label';

CREATE INDEX IF NOT EXISTS idx_knowledge_pos ON public.knowledge (pos);
CREATE INDEX IF NOT EXISTS idx_knowledge_level ON public.knowledge (level);
CREATE INDEX IF NOT EXISTS idx_knowledge_theme ON public.knowledge (theme);

CREATE OR REPLACE FUNCTION public.knowledge_sync_from_metadata()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.metadata IS NOT NULL THEN
    IF NEW.metadata ? 'pos' THEN
      NEW.pos := COALESCE(NEW.metadata->>'pos', '');
    END IF;
    IF NEW.metadata ? 'level' THEN
      NEW.level := COALESCE(NEW.metadata->>'level', '');
    END IF;
    IF NEW.metadata ? 'selfExaminePrompt' THEN
      NEW.self_examine_prompt := COALESCE(NEW.metadata->>'selfExaminePrompt', '');
    END IF;
    IF NEW.metadata ? 'theme' THEN
      NEW.theme := COALESCE(NEW.metadata->>'theme', '');
    END IF;
    NEW.metadata := NEW.metadata - 'pos' - 'level' - 'selfExaminePrompt' - 'theme';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knowledge_sync_from_metadata_trigger ON public.knowledge;
-- INSERT always fires; UPDATE only when `metadata` column is touched.
CREATE TRIGGER knowledge_sync_from_metadata_trigger
  BEFORE INSERT OR UPDATE OF metadata ON public.knowledge
  FOR EACH ROW
  EXECUTE FUNCTION public.knowledge_sync_from_metadata();

-- Due cards: filter by knowledge.level column
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
  ORDER BY random()
  LIMIT p_limit;
$$;

-- Exam vocab counts
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

  IF p_levels IS NULL OR cardinality(p_levels) = 0 THEN
    RETURN json_build_object('total', 0, 'brushed', 0);
  END IF;

  SELECT COUNT(*)::int INTO v_total
  FROM public.knowledge k
  WHERE k.level = ANY(p_levels);

  SELECT COUNT(DISTINCT ac.knowledge_code)::int INTO v_brushed
  FROM public.account_cards ac
  INNER JOIN public.knowledge k ON ac.knowledge_code = k.code
  WHERE ac.profile_id = p_profile_id
    AND k.level = ANY(p_levels)
    AND ac.repetitions > 0;

  RETURN json_build_object(
    'total', COALESCE(v_total, 0),
    'brushed', COALESCE(v_brushed, 0)
  );
END;
$$;
