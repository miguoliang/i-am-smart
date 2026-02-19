import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createPagePayForm } from "@/lib/alipay";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { logger } from "@/lib/utils/logger";

const MIN_AMOUNT = 0.01;
const MAX_AMOUNT = 999999.99;

function getAppOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`);
  if (!origin) throw new Error("NEXT_PUBLIC_APP_ORIGIN or VERCEL_URL required");
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** POST: 创建支付宝 PC 网站支付订单，返回跳转表单 HTML */
export async function POST(req: NextRequest) {
  try {
    const appId = process.env.ALIPAY_APP_ID;
    if (!appId) {
      throw ApiError.internal("支付宝支付未配置");
    }

    const body = await req.json();
    const amount =
      typeof body.amount === "number"
        ? body.amount
        : parseFloat(String(body.amount ?? 0));
    const subject = typeof body.subject === "string" ? body.subject.trim() : "";

    if (isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      throw ApiError.validationError("金额无效，需在 0.01～999999.99 元之间");
    }
    if (!subject || subject.length > 256) {
      throw ApiError.validationError("商品标题必填且不超过 256 字");
    }

    let accountId: string | null = null;
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) accountId = user.id;

    const outTradeNo = `AP${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const origin = getAppOrigin();
    const notifyUrl = `${origin}/api/pay/alipay/notify`;
    const returnUrl = body.return_url || `${origin}/pay/result`;

    const formHtml = createPagePayForm({
      outTradeNo,
      totalAmount: amount.toFixed(2),
      subject,
      returnUrl,
      notifyUrl,
      body: typeof body.body === "string" ? body.body.slice(0, 128) : undefined,
    });

    const admin = createSupabaseAdmin();
    const { error } = await admin.from("pay_orders").insert({
      out_trade_no: outTradeNo,
      account_id: accountId,
      amount_total: Math.round(amount * 100), // 存储为分
      description: subject,
      status: "pending",
      pay_channel: "alipay_page",
    });
    if (error) {
      logger.error("pay_orders insert failed", { error: error.message });
      throw ApiError.internal("创建订单失败");
    }

    return apiSuccess({ form_html: formHtml, out_trade_no: outTradeNo });
  } catch (e) {
    return handleApiError(e);
  }
}
