import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  apiSuccess,
  handleApiError,
  ApiError,
  PUBLIC_INTERNAL_ERROR_MESSAGE,
} from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { logger } from "@/lib/utils/logger";

export interface OrderRow {
  out_trade_no: string;
  status: string;
  amount_total: number;
  description: string | null;
  pay_channel: string | null;
  account_id: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface OrdersResponse {
  orders: OrderRow[];
  total: number;
  summary: { totalAmount: number; count: number };
}

const VALID_STATUSES = ["pending", "paid", "failed", "all"];
const VALID_CHANNELS = ["wechat", "alipay", "all"];

/** GET: List orders with pagination and filters (operator only) */
export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") ?? "20", 10)));
    const status = searchParams.get("status") ?? "all";
    const channel = searchParams.get("channel") ?? "all";
    const startDate = searchParams.get("startDate") ?? "";
    const endDate = searchParams.get("endDate") ?? "";

    if (!VALID_STATUSES.includes(status)) {
      throw ApiError.validationError("无效的 status");
    }
    if (!VALID_CHANNELS.includes(channel)) {
      throw ApiError.validationError("无效的 channel");
    }

    const admin = createSupabaseAdmin();
    const select =
      "out_trade_no, status, amount_total, description, pay_channel, account_id, created_at, paid_at";

    let query = admin.from("pay_orders").select(select, { count: "exact" });

    if (status !== "all") {
      query = query.eq("status", status);
    }
    if (channel !== "all") {
      query = query.like("pay_channel", `${channel}%`);
    }
    if (startDate) {
      query = query.gte("created_at", `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte("created_at", `${endDate}T23:59:59.999Z`);
    }

    query = query.order("created_at", { ascending: false });
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;
    const { data: orders, error: listError, count } = await query.range(from, to);

    if (listError) {
      logger.error("Operator orders: list failed", { message: listError.message });
      throw ApiError.internal(PUBLIC_INTERNAL_ERROR_MESSAGE);
    }

    const total = count ?? 0;

    // Summary: total revenue (sum amount_total for paid) and total count for current filter
    let summaryQuery = admin
      .from("pay_orders")
      .select("amount_total, status")
      .eq("status", "paid");
    if (channel !== "all") {
      summaryQuery = summaryQuery.like("pay_channel", `${channel}%`);
    }
    if (startDate) {
      summaryQuery = summaryQuery.gte("created_at", `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      summaryQuery = summaryQuery.lte("created_at", `${endDate}T23:59:59.999Z`);
    }
    const { data: paidRows, error: sumError } = await summaryQuery.limit(50000);

    if (sumError) {
      logger.error("Operator orders: summary query failed", { message: sumError.message });
      throw ApiError.internal(PUBLIC_INTERNAL_ERROR_MESSAGE);
    }

    const totalAmount = (paidRows ?? []).reduce((acc, row) => acc + (row.amount_total ?? 0), 0);

    const response: OrdersResponse = {
      orders: (orders ?? []) as OrderRow[],
      total,
      summary: { totalAmount, count: total },
    };

    return apiSuccess(response);
  } catch (e) {
    return handleApiError(e);
  }
}
