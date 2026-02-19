-- 支付宝支付支持：添加 alipay_trade_no 和 pay_channel 字段
ALTER TABLE public.pay_orders
  ADD COLUMN IF NOT EXISTS alipay_trade_no text,
  ADD COLUMN IF NOT EXISTS pay_channel text;

-- 更新 comment
COMMENT ON COLUMN public.pay_orders.alipay_trade_no IS '支付宝交易号';
COMMENT ON COLUMN public.pay_orders.pay_channel IS '支付渠道: wechat_native, alipay_page, alipay_wap';
COMMENT ON TABLE public.pay_orders IS '支付订单表，支持微信支付和支付宝支付';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_pay_orders_alipay_trade_no ON public.pay_orders(alipay_trade_no);
CREATE INDEX IF NOT EXISTS idx_pay_orders_pay_channel ON public.pay_orders(pay_channel);
