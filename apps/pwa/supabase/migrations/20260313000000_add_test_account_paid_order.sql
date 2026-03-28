-- 给测试账号 13800000001 插入一条 paid 订单，用于微信支付审核测试
-- user_id: cd23e851-3f97-4148-a1b3-983e952481e7
-- accounts.id 引用 auth.users(id)；必须先有 auth 用户，give_cards_to_new_user 会创建 public.accounts
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'cd23e851-3f97-4148-a1b3-983e952481e7',
  'authenticated',
  'authenticated',
  '13800000001@wechat-review.test',
  extensions.crypt('password123', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pay_orders (
  out_trade_no,
  account_id,
  amount_total,
  description,
  status,
  plan_type,
  paid_at
)
VALUES (
  'TEST-WECHAT-REVIEW-001',
  'cd23e851-3f97-4148-a1b3-983e952481e7',
  2980,
  'Pro 年度会员（测试）',
  'paid',
  'yearly',
  now()
)
ON CONFLICT (out_trade_no) DO NOTHING;
