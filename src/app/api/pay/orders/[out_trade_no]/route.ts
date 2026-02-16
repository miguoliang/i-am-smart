import { NextRequest } from "next/server";
import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";

/** GET: 查询订单状态（轮询支付结果）。未登录仅返回 status；登录且为本人订单返回完整信息 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ out_trade_no: string }> }
) {
  try {
    const { out_trade_no } = await params;
    if (!out_trade_no || out_trade_no.length > 32) {
      throw ApiError.validationError("订单号无效");
    }
    const admin = createSupabaseAdmin();
    const { data: order, error } = await admin
      .from("pay_orders")
      .select("out_trade_no, status, amount_total, description, paid_at, account_id")
      .eq("out_trade_no", out_trade_no)
      .single();
    if (error || !order) {
      throw ApiError.notFound("订单不存在");
    }
    const supabase = await createRouteHandlerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const isOwner = user && order.account_id === user.id;
    if (isOwner) {
      return apiSuccess({
        out_trade_no: order.out_trade_no,
        status: order.status,
        amount_total: order.amount_total,
        description: order.description,
        paid_at: order.paid_at,
      });
    }
    return apiSuccess({
      out_trade_no: order.out_trade_no,
      status: order.status,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
