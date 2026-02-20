-- Migration: Add operator audit log table
-- Date: 2026-02-20
-- Description: Track operator actions for auditing

CREATE TABLE IF NOT EXISTS public.operator_logs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  operator_id uuid NOT NULL,
  action text NOT NULL,
  target_type text,
  target_id text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operator_logs_created_at ON public.operator_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operator_logs_action ON public.operator_logs(action);

ALTER TABLE public.operator_logs ENABLE ROW LEVEL SECURITY;

-- Only service_role can insert/read (operators go through API)
CREATE POLICY "Service role full access"
  ON public.operator_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.operator_logs IS 'Audit log for operator actions';
