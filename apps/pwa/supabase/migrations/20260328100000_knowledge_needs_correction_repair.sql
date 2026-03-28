-- 已应用旧版 20260320120100（仅创建 knowledge_error_reports 表）的环境：删表并补列
DROP TABLE IF EXISTS public.knowledge_error_reports CASCADE;

ALTER TABLE public.knowledge
  ADD COLUMN IF NOT EXISTS needs_correction boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.knowledge.needs_correction IS '待纠错：学员标记词条需修正，运营改正后在后台清除。';

CREATE INDEX IF NOT EXISTS idx_knowledge_needs_correction
  ON public.knowledge (code) WHERE needs_correction = true;
