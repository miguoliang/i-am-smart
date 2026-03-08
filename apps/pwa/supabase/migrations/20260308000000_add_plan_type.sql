-- 添加 plan_type 字段，支持套餐式下单
ALTER TABLE public.pay_orders
  ADD COLUMN IF NOT EXISTS plan_type text;

COMMENT ON COLUMN public.pay_orders.plan_type IS '套餐类型: monthly, yearly';
