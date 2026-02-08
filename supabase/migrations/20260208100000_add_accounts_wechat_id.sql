-- Add wechat_id to accounts for WeChat OAuth identity binding.
-- Used by /api/auth/wechat/callback to map wechat openid/unionid to Supabase user.
ALTER TABLE public.accounts
  ADD COLUMN IF NOT EXISTS wechat_id text UNIQUE;

COMMENT ON COLUMN public.accounts.wechat_id IS 'WeChat openid or unionid for OAuth login binding';
