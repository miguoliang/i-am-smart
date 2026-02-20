-- WeChat Pay Native orders (商户订单)
CREATE TABLE IF NOT EXISTS public.pay_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  out_trade_no text NOT NULL UNIQUE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  amount_total integer NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'closed', 'refunded')),
  wechat_transaction_id text,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pay_orders_out_trade_no ON public.pay_orders(out_trade_no);
CREATE INDEX IF NOT EXISTS idx_pay_orders_account_id ON public.pay_orders(account_id);
CREATE INDEX IF NOT EXISTS idx_pay_orders_status ON public.pay_orders(status);

ALTER TABLE public.pay_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own orders"
  ON public.pay_orders FOR SELECT
  USING (auth.uid() = account_id OR account_id IS NULL);

COMMENT ON TABLE public.pay_orders IS 'WeChat Pay Native orders for QR code payment';
