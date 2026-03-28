-- Replace knowledge.metadata with explicit example_sentence and image_name columns.
-- Drops knowledge_sync_from_metadata trigger (no longer applicable).

ALTER TABLE public.knowledge
  ADD COLUMN IF NOT EXISTS example_sentence text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_name text;

UPDATE public.knowledge
SET
  example_sentence = COALESCE(metadata->>'exampleSentence', ''),
  image_name = NULLIF(TRIM(COALESCE(metadata->>'imageName', '')), '');

DROP TRIGGER IF EXISTS knowledge_sync_from_metadata_trigger ON public.knowledge;
DROP FUNCTION IF EXISTS public.knowledge_sync_from_metadata();

DROP INDEX IF EXISTS public.idx_knowledge_metadata;

ALTER TABLE public.knowledge DROP COLUMN IF EXISTS metadata;

COMMENT ON COLUMN public.knowledge.example_sentence IS 'Illustrative sentence for the entry';
COMMENT ON COLUMN public.knowledge.image_name IS 'Optional image asset key or filename';
