-- Allow the same lemma (name) at different CEFR levels and with different POS rows.
-- Required for CEFR vocabulary seeds and multi-sense entries (e.g. like prep. vs v. at A1).

ALTER TABLE public.knowledge DROP CONSTRAINT IF EXISTS knowledge_name_key;

CREATE UNIQUE INDEX IF NOT EXISTS knowledge_name_level_pos_key
  ON public.knowledge (name, level, pos);
