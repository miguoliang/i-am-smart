-- User-reported knowledge errors (operators review and fix in 单词列表)

CREATE TABLE IF NOT EXISTS public.knowledge_error_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  knowledge_code character varying(20) NOT NULL REFERENCES public.knowledge (code) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_knowledge_error_reports_unresolved
  ON public.knowledge_error_reports (created_at DESC)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_knowledge_error_reports_knowledge_code
  ON public.knowledge_error_reports (knowledge_code);

COMMENT ON TABLE public.knowledge_error_reports IS 'Learner flags for incorrect dictionary entries; operators resolve after editing knowledge.';
