import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";
import { validateUserStats } from "@/lib/repositories/utils/validation";

export interface UserDetailProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  banned_until?: string | null;
}

export interface UserDetailStats {
  total: number;
  mastered: number;
  learning: number;
  dueToday: number;
}

export interface UserDetailOrder {
  out_trade_no: string;
  status: string;
  amount_total: number;
  description: string | null;
  channel: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface UserDetailResponse {
  profile: UserDetailProfile;
  stats: UserDetailStats;
  recentOrders: UserDetailOrder[];
}

/** GET: User detail — profile + learning stats + recent orders (operator only) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOperator(req);
    const { id } = await params;
    if (!id) {
      throw ApiError.validationError("缺少用户 ID");
    }

    const admin = createSupabaseAdmin();

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(id);
    if (userError || !userData?.user) {
      throw ApiError.notFound("用户不存在");
    }

    const u = userData.user;
    const profile: UserDetailProfile = {
      id: u.id,
      username:
        u.user_metadata?.username ||
        u.email?.split("@")[0] ||
        u.id.substring(0, 8),
      email: u.email ?? "",
      role: (u.app_metadata?.role as string)?.trim() || "learner",
      created_at: u.created_at,
      updated_at: u.updated_at ?? u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      banned_until: u.banned_until ?? null,
    };

    const { data: statsData, error: statsError } = await admin.rpc(
      "get_user_stats",
      { p_user_id: id }
    );
    let stats: UserDetailStats = {
      total: 0,
      mastered: 0,
      learning: 0,
      dueToday: 0,
    };
    if (!statsError && statsData) {
      stats = validateUserStats(statsData);
    }

    const { data: ordersData, error: ordersError } = await admin
      .from("pay_orders")
      .select("out_trade_no, status, amount_total, description, channel, created_at, paid_at")
      .eq("account_id", id)
      .order("created_at", { ascending: false })
      .limit(10);

    const recentOrders: UserDetailOrder[] = ordersError
      ? []
      : (ordersData ?? []).map((row) => ({
          out_trade_no: row.out_trade_no,
          status: row.status,
          amount_total: row.amount_total ?? 0,
          description: row.description ?? null,
          channel: row.channel ?? null,
          created_at: row.created_at,
          paid_at: row.paid_at ?? null,
        }));

    const response: UserDetailResponse = {
      profile,
      stats,
      recentOrders,
    };

    return apiSuccess(response);
  } catch (e) {
    return handleApiError(e);
  }
}
