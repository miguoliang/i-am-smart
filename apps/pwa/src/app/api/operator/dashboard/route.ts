import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

interface DayMetric {
  date: string;
  count: number;
}

interface DayRevenue {
  date: string;
  amount: number;
}

interface DashboardResponse {
  todayRegistrations: number;
  totalUsers: number;
  todayReviews: number;
  todayRevenue: number;
  trends: {
    registrations: DayMetric[];
    reviews: DayMetric[];
    revenue: DayRevenue[];
  };
}

function getTodayRange(offsetMinutes: number) {
  const now = new Date();
  const local = new Date(now.getTime() - offsetMinutes * 60 * 1000);
  const dateStr = local.toISOString().slice(0, 10);
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  start.setTime(start.getTime() + offsetMinutes * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString(), dateStr };
}

function getLast30Days(offsetMinutes: number): string[] {
  const now = new Date();
  const local = new Date(now.getTime() - offsetMinutes * 60 * 1000);
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(local.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

/** GET: Dashboard metrics (operator only) */
export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);

    const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
    const admin = createSupabaseAdmin();
    const today = getTodayRange(offset);
    const days = getLast30Days(offset);

    // --- Users (auth admin API) ---
    let totalUsers = 0;
    let todayRegistrations = 0;
    let page = 1;
    const registrationsByDay = new Map<string, number>();
    while (true) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users) break;
      totalUsers += data.users.length;
      for (const u of data.users) {
        const createdLocal = new Date(
          new Date(u.created_at).getTime() - offset * 60 * 1000
        );
        const dateStr = createdLocal.toISOString().slice(0, 10);
        if (u.created_at >= today.start && u.created_at < today.end) {
          todayRegistrations++;
        }
        registrationsByDay.set(dateStr, (registrationsByDay.get(dateStr) || 0) + 1);
      }
      if (data.users.length < 1000) break;
      page++;
    }

    const registrationTrends: DayMetric[] = days.map((d) => ({
      date: d,
      count: registrationsByDay.get(d) || 0,
    }));

    // --- Reviews (RPC) ---
    const { data: reviewRpc } = await admin.rpc("get_dashboard_review_trends", {
      p_tz_offset: offset,
      p_days: 30,
    });

    const reviewMap = new Map<string, number>();
    for (const row of reviewRpc ?? []) {
      reviewMap.set(row.review_date, Number(row.review_count));
    }
    const todayReviews = reviewMap.get(today.dateStr) || 0;
    const reviewTrends: DayMetric[] = days.map((d) => ({
      date: d,
      count: reviewMap.get(d) || 0,
    }));

    // --- Revenue (RPC) ---
    const { data: revenueRpc } = await admin.rpc("get_dashboard_revenue_trends", {
      p_tz_offset: offset,
      p_days: 30,
    });

    const revenueMap = new Map<string, number>();
    for (const row of revenueRpc ?? []) {
      revenueMap.set(row.revenue_date, Number(row.revenue_amount));
    }
    const todayRevenue = revenueMap.get(today.dateStr) || 0;
    const revenueTrends: DayRevenue[] = days.map((d) => ({
      date: d,
      amount: revenueMap.get(d) || 0,
    }));

    const response: DashboardResponse = {
      todayRegistrations,
      totalUsers,
      todayReviews,
      todayRevenue,
      trends: {
        registrations: registrationTrends,
        reviews: reviewTrends,
        revenue: revenueTrends,
      },
    };

    return apiSuccess(response);
  } catch (e) {
    return handleApiError(e);
  }
}
