import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getPlatformCertificates,
  getApiV3Key,
  verifyNotifySignature,
  decryptNotifyResource,
} from "@/lib/wechatPay";
import { logger } from "@/lib/utils/logger";

interface NotifyPayload {
  id?: string;
  event_type?: string;
  resource_type?: string;
  resource?: {
    algorithm?: string;
    ciphertext?: string;
    associated_data?: string;
    nonce?: string;
    original_type?: string;
  };
}

function failResponse(message: string): NextResponse {
  return NextResponse.json({ code: "FAIL", message }, { status: 500 });
}

/** 微信支付成功回调：验签、解密、更新订单，5 秒内返回 200 */
export async function POST(req: NextRequest) {
  try {
    const serial = req.headers.get("wechatpay-serial") ?? "";
    const signature = req.headers.get("wechatpay-signature") ?? "";
    const timestamp = req.headers.get("wechatpay-timestamp") ?? "";
    const nonce = req.headers.get("wechatpay-nonce") ?? "";
    const rawBody = await req.text();
    if (!serial || !signature || !timestamp || !nonce || !rawBody) {
      return failResponse("missing headers or body");
    }
    if (req.headers.get("content-type")?.includes("application/json") === false) {
      return failResponse("invalid content-type");
    }

    const certs = await getPlatformCertificates();
    const platformPem = certs.get(serial);
    if (!platformPem) {
      logger.warn("WeChat Pay notify: unknown platform serial", { serial });
      return failResponse("unknown certificate");
    }
    const valid = verifyNotifySignature(serial, signature, timestamp, nonce, rawBody, platformPem);
    if (!valid) {
      logger.warn("WeChat Pay notify: signature verification failed");
      return failResponse("signature verification failed");
    }

    const payload = JSON.parse(rawBody) as NotifyPayload;
    if (payload.event_type !== "TRANSACTION.SUCCESS" || payload.resource_type !== "encrypt-resource") {
      return NextResponse.json({ code: "FAIL", message: "unexpected event" }, { status: 400 });
    }
    const resource = payload.resource;
    if (!resource?.ciphertext || !resource?.nonce) {
      return failResponse("invalid resource");
    }

    const apiV3Key = getApiV3Key();
    const decrypted = decryptNotifyResource(apiV3Key, {
      algorithm: resource.algorithm ?? "AEAD_AES_256_GCM",
      ciphertext: resource.ciphertext,
      associated_data: resource.associated_data,
      nonce: resource.nonce,
      original_type: resource.original_type,
    });
    if (decrypted.trade_state !== "SUCCESS") {
      return NextResponse.json({ code: "FAIL", message: "trade not success" }, { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const { error } = await admin
      .from("pay_orders")
      .update({
        status: "paid",
        wechat_transaction_id: decrypted.transaction_id,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("out_trade_no", decrypted.out_trade_no)
      .eq("status", "pending");
    if (error) {
      logger.error("WeChat Pay notify: update order failed", {
        out_trade_no: decrypted.out_trade_no,
        error: error.message,
      });
      return failResponse("update failed");
    }
    return new NextResponse(null, { status: 200 });
  } catch (e) {
    logger.error("WeChat Pay notify exception", { error: e });
    return failResponse("internal error");
  }
}
