-- 给测试账号 13800000001 插入一条 paid 订单，用于微信支付审核测试
-- user_id: cd23e851-3f97-4148-a1b3-983e952481e7
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
