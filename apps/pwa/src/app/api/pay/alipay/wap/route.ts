import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createWapPayForm } from "@/lib/alipay";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { getPayPlan } from "@/lib/payPlans";

function getAppOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (!origin) throw new Error("NEXT_PUBLIC_APP_ORIGIN is required");
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** POST: 创建支付宝手机网站支付订单，返回跳转表单 HTML */
export async function POST(req: NextRequest) {
  try {
    const appId = process.env.ALIPAY_APP_ID;
    if (!appId) {
      throw ApiError.internal("支付宝支付未配置");
    }

    const body = await req.json();
    const plan = getPayPlan(body.plan_type);
    if (!plan) {
      throw ApiError.validationError(
        "无效的套餐类型，请选择 monthly 或 yearly"
      );
    }

    const { user } = await requireAuth(req);
    const subject = plan.description;

    const outTradeNo = `AW${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const origin = getAppOrigin();
    const notifyUrl = `${origin}/api/pay/alipay/notify`;
    const returnUrl = `${origin}/pay/result`;
    const quitUrl = origin;

    const formHtml = createWapPayForm({
      outTradeNo,
      totalAmount: (plan.amountCents / 100).toFixed(2),
      subject,
      returnUrl,
      notifyUrl,
      quitUrl,
    });

    const admin = createSupabaseAdmin();
    const { error } = await admin.from("pay_orders").insert({
      out_trade_no: outTradeNo,
      account_id: user.id,
      amount_total: plan.amountCents,
      description: subject,
      status: "pending",
      pay_channel: "alipay_wap",
      plan_type: plan.type,
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
