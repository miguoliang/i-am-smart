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

function getLast30DaysRange(offsetMinutes: number) {
  const now = new Date();
  const local = new Date(now.getTime() - offsetMinutes * 60 * 1000);
  const todayStr = local.toISOString().slice(0, 10);
  const end = new Date(`${todayStr}T00:00:00.000Z`);
  end.setTime(end.getTime() + offsetMinutes * 60 * 1000 + 24 * 60 * 60 * 1000);
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
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
    const range30 = getLast30DaysRange(offset);
    const days = getLast30Days(offset);

    // --- Total users ---
    // Supabase auth admin listUsers is paginated; use a large perPage to get count
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

    // --- Today reviews ---
    const { count: todayReviews } = await admin
      .from("account_cards")
      .select("*", { count: "exact", head: true })
      .gte("updated_at", today.start)
      .lt("updated_at", today.end)
      .gt("repetitions", 0);

    // --- Review trends (30 days) ---
    // Query reviews grouped by day — use raw select with date truncation
    const { data: reviewRows } = await admin
      .from("account_cards")
      .select("updated_at")
      .gte("updated_at", range30.start)
      .lt("updated_at", range30.end)
      .gt("repetitions", 0)
      .limit(50000);

    const reviewsByDay = new Map<string, number>();
    for (const row of reviewRows ?? []) {
      const d = new Date(
        new Date(row.updated_at).getTime() - offset * 60 * 1000
      );
      const dateStr = d.toISOString().slice(0, 10);
      reviewsByDay.set(dateStr, (reviewsByDay.get(dateStr) || 0) + 1);
    }
    const reviewTrends: DayMetric[] = days.map((d) => ({
      date: d,
      count: reviewsByDay.get(d) || 0,
    }));

    // --- Today revenue ---
    const { data: todayPaid } = await admin
      .from("pay_orders")
      .select("amount_total")
      .eq("status", "paid")
      .gte("paid_at", today.start)
      .lt("paid_at", today.end);

    const todayRevenue = (todayPaid ?? []).reduce(
      (sum, r) => sum + (r.amount_total ?? 0),
      0
    );

    // --- Revenue trends (30 days) ---
    const { data: revRows } = await admin
      .from("pay_orders")
      .select("amount_total, paid_at")
      .eq("status", "paid")
      .gte("paid_at", range30.start)
      .lt("paid_at", range30.end)
      .limit(50000);

    const revenueByDay = new Map<string, number>();
    for (const row of revRows ?? []) {
      const d = new Date(
        new Date(row.paid_at).getTime() - offset * 60 * 1000
      );
      const dateStr = d.toISOString().slice(0, 10);
      revenueByDay.set(dateStr, (revenueByDay.get(dateStr) || 0) + (row.amount_total ?? 0));
    }
    const revenueTrends: DayRevenue[] = days.map((d) => ({
      date: d,
      amount: revenueByDay.get(d) || 0,
    }));

    const response: DashboardResponse = {
      todayRegistrations,
      totalUsers,
      todayReviews: todayReviews ?? 0,
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
