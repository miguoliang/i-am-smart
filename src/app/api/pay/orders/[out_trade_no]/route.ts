import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";

/** GET: 查询订单状态（轮询支付结果）。仅订单所有者可查询完整信息 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ out_trade_no: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const { out_trade_no } = await params;
    if (!out_trade_no || out_trade_no.length > 32) {
      throw ApiError.validationError("订单号无效");
    }
    const admin = createSupabaseAdmin();
    const { data: order, error } = await admin
      .from("pay_orders")
      .select("out_trade_no, status, amount_total, description, paid_at, account_id")
      .eq("out_trade_no", out_trade_no)
      .eq("account_id", user.id)
      .single();
    if (error || !order) {
      throw ApiError.notFound("订单不存在");
    }
    return apiSuccess({
      out_trade_no: order.out_trade_no,
      status: order.status,
      amount_total: order.amount_total,
      description: order.description,
      paid_at: order.paid_at,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
