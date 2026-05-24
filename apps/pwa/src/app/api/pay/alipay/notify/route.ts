import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { verifyNotify, isTradeSuccess, AlipayNotifyParams } from "@/lib/alipay";
import { logger } from "@/lib/utils/logger";

function parseAmountCents(totalAmount: string | undefined): number | null {
  if (!totalAmount || !/^\d+(?:\.\d{1,2})?$/.test(totalAmount)) return null;
  return Math.round(Number(totalAmount) * 100);
}

/** 支付宝异步通知处理 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const params: AlipayNotifyParams = {};
    formData.forEach((value, key) => {
      params[key] = String(value);
    });

    // 验证签名
    if (!verifyNotify(params)) {
      logger.warn("Alipay notify: signature verification failed", {
        out_trade_no: params.out_trade_no,
        trade_no: params.trade_no,
        notify_id: params.notify_id,
      });
      return new NextResponse("fail", { status: 400 });
    }

    // 检查交易状态
    if (!isTradeSuccess(params.trade_status)) {
      // 非成功状态，返回 success 但不更新订单
      return new NextResponse("success", { status: 200 });
    }

    const outTradeNo = params.out_trade_no;
    const tradeNo = params.trade_no;
    const gmtPayment = params.gmt_payment;
    const paidTotal = parseAmountCents(params.total_amount);

    if (!outTradeNo || !tradeNo || paidTotal === null) {
      logger.warn("Alipay notify: missing trade info", {
        out_trade_no: outTradeNo,
        trade_no: tradeNo,
        has_total_amount: !!params.total_amount,
      });
      return new NextResponse("fail", { status: 400 });
    }

    const admin = createSupabaseAdmin();
    const { data: order, error: orderError } = await admin
      .from("pay_orders")
      .select("amount_total")
      .eq("out_trade_no", outTradeNo)
      .eq("status", "pending")
      .single();
    if (orderError || !order) {
      logger.warn("Alipay notify: pending order not found", { out_trade_no: outTradeNo });
      return new NextResponse("fail", { status: 400 });
    }
    if (order.amount_total !== paidTotal) {
      logger.warn("Alipay notify: amount mismatch", {
        out_trade_no: outTradeNo,
        expected: order.amount_total,
        paid: paidTotal,
      });
      return new NextResponse("fail", { status: 400 });
    }

    const { error } = await admin
      .from("pay_orders")
      .update({
        status: "paid",
        alipay_trade_no: tradeNo,
        paid_at: gmtPayment ? new Date(gmtPayment).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("out_trade_no", outTradeNo)
      .eq("amount_total", paidTotal)
      .eq("status", "pending");

    if (error) {
      logger.error("Alipay notify: update order failed", {
        out_trade_no: outTradeNo,
        error: error.message,
      });
      return new NextResponse("fail", { status: 500 });
    }

    return new NextResponse("success", { status: 200 });
  } catch (e) {
    logger.error("Alipay notify exception", { error: e });
    return new NextResponse("fail", { status: 500 });
  }
}
