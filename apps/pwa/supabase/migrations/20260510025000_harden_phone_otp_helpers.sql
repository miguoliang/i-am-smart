-- Persistent helpers for phone OTP safety.
--
-- App-side in-memory counters are process-local. Keep OTP throttling in the
-- database so limits survive restarts and work consistently across processes.

CREATE TABLE IF NOT EXISTS public.otp_rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL CHECK (count >= 0),
  reset_at timestamp with time zone NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.otp_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.otp_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.check_otp_rate_limit(
  p_key text,
  p_max_attempts integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now timestamp with time zone := now();
  v_count integer;
BEGIN
  IF p_key IS NULL OR length(trim(p_key)) = 0 THEN
    RAISE EXCEPTION 'rate limit key is required' USING ERRCODE = '22023';
  END IF;
  IF p_max_attempts <= 0 OR p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'invalid rate limit configuration' USING ERRCODE = '22023';
  END IF;

  DELETE FROM public.otp_rate_limits
  WHERE reset_at <= v_now - interval '1 day';

  INSERT INTO public.otp_rate_limits (key, count, reset_at, updated_at)
  VALUES (
    p_key,
    1,
    v_now + make_interval(secs => p_window_seconds),
    v_now
  )
  ON CONFLICT (key) DO UPDATE
  SET
    count = CASE
      WHEN public.otp_rate_limits.reset_at <= v_now THEN 1
      WHEN public.otp_rate_limits.count < p_max_attempts THEN public.otp_rate_limits.count + 1
      ELSE public.otp_rate_limits.count
    END,
    reset_at = CASE
      WHEN public.otp_rate_limits.reset_at <= v_now THEN v_now + make_interval(secs => p_window_seconds)
      ELSE public.otp_rate_limits.reset_at
    END,
    updated_at = v_now
  RETURNING count INTO v_count;

  RETURN v_count <= p_max_attempts;
END;
$$;

REVOKE ALL ON FUNCTION public.check_otp_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_otp_rate_limit(text, integer, integer) TO service_role;

-- Service-role-only targeted lookup for the WeChat review phone test flow.
-- Avoid listUsers() pagination scans in application code.
CREATE OR REPLACE FUNCTION public.find_auth_user_by_phone_or_email(
  p_phone text,
  p_email text
)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.id
  FROM auth.users u
  WHERE (p_phone IS NOT NULL AND u.phone = p_phone)
     OR (p_email IS NOT NULL AND u.email = p_email)
  ORDER BY u.created_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.find_auth_user_by_phone_or_email(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.find_auth_user_by_phone_or_email(text, text) TO service_role;

-- Keep the seeded WeChat review order aligned with the canonical yearly plan.
UPDATE public.pay_orders
SET
  amount_total = 19900,
  description = 'i am smart Pro 年付（测试）',
  updated_at = now()
WHERE out_trade_no = 'TEST-WECHAT-REVIEW-001'
  AND amount_total <> 19900;
