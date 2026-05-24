import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createNativeOrder } from "@/lib/wechatPay";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";
import { getPayPlan } from "@/lib/payPlans";

function getAppOrigin(): string {
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  if (!origin) throw new Error("NEXT_PUBLIC_APP_ORIGIN is required");
  return origin.endsWith("/") ? origin.slice(0, -1) : origin;
}

/** POST: 创建微信 Native 支付订单，返回 code_url 用于生成二维码 */
export async function POST(req: NextRequest) {
  try {
    const appId = process.env.WECHAT_PAY_APP_ID;
    const mchId = process.env.WECHAT_PAY_MCH_ID;
    if (!appId || !mchId) {
      throw ApiError.internal("微信支付未配置");
    }

    const body = await req.json();
    const plan = getPayPlan(body.plan_type);
    if (!plan) {
      throw ApiError.validationError(
        "无效的套餐类型，请选择 monthly 或 yearly"
      );
    }

    const { user } = await requireAuth(req);
    const accountId = user.id;

    const outTradeNo = `N${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const notifyUrl = `${getAppOrigin()}/api/pay/wechat/notify`;

    const { codeUrl } = await createNativeOrder({
      appId,
      mchId,
      description: plan.description,
      outTradeNo,
      notifyUrl,
      totalCents: plan.amountCents,
      attach: plan.type,
    });

    const admin = createSupabaseAdmin();
    const { error } = await admin.from("pay_orders").insert({
      out_trade_no: outTradeNo,
      account_id: accountId,
      amount_total: plan.amountCents,
      description: plan.description,
      status: "pending",
      pay_channel: "wechat_native",
      plan_type: plan.type,
    });
    if (error) {
      logger.error("pay_orders insert failed", { error: error.message });
      throw ApiError.internal("创建订单失败");
    }

    return apiSuccess({ code_url: codeUrl, out_trade_no: outTradeNo });
  } catch (e) {
    return handleApiError(e);
  }
}
