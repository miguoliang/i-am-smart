import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createNativeOrder } from "@/lib/wechatPay";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

const MIN_TOTAL_CENTS = 1;
const MAX_TOTAL_CENTS = 99999999;

function getAppOrigin(): string {
  const origin =
    process.env.NEXT_PUBLIC_APP_ORIGIN ||
    (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`);
  if (!origin) throw new Error("NEXT_PUBLIC_APP_ORIGIN or VERCEL_URL required");
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
    const totalCents =
      typeof body.amount === "number"
        ? body.amount
        : Math.round(parseFloat(String(body.amount ?? 0)) * 100);
    const description = typeof body.description === "string" ? body.description.trim() : "";

    if (
      !Number.isInteger(totalCents) ||
      totalCents < MIN_TOTAL_CENTS ||
      totalCents > MAX_TOTAL_CENTS
    ) {
      throw ApiError.validationError("金额无效，需在 0.01～999999.99 元之间");
    }
    if (!description || description.length > 127) {
      throw ApiError.validationError("商品描述必填且不超过 127 字");
    }

    const { user } = await requireAuth(req);
    const accountId = user.id;

    const outTradeNo = `N${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
    const notifyUrl = `${getAppOrigin()}/api/pay/wechat/notify`;

    const { codeUrl } = await createNativeOrder({
      appId,
      mchId,
      description,
      outTradeNo,
      notifyUrl,
      totalCents,
      attach: typeof body.attach === "string" ? body.attach.slice(0, 128) : undefined,
    });

    const admin = createSupabaseAdmin();
    const { error } = await admin.from("pay_orders").insert({
      out_trade_no: outTradeNo,
      account_id: accountId,
      amount_total: totalCents,
      description,
      status: "pending",
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
