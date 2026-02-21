import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

export interface SaasMetricsResponse {
  activeUsers: {
    dau: number;
    wau: number;
    mau: number;
    dauMauRatio: number;
  };
  cohortRetention: {
    cohort_week: string;
    cohort_size: number;
    d1_retention: number;
    d7_retention: number;
    d30_retention: number;
  }[];
  churn: {
    weeklyChurnRate: number;
    monthlyChurnRate: number;
    weeklyActiveBase: number;
    weeklyChurned: number;
    monthlyActiveBase: number;
    monthlyChurned: number;
  };
  arppu: {
    totalRevenue: number;
    payingUsers: number;
    arppu: number;
    monthlyRevenue: number;
    monthlyPayingUsers: number;
    monthlyArppu: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);

    const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
    const admin = createSupabaseAdmin();

    const [activeUsersRes, cohortRes, churnRes, arppuRes] = await Promise.all([
      admin.rpc("get_dashboard_active_users", { p_tz_offset: offset }),
      admin.rpc("get_dashboard_cohort_retention", { p_tz_offset: offset, p_weeks: 8 }),
      admin.rpc("get_dashboard_churn", { p_tz_offset: offset }),
      admin.rpc("get_dashboard_arppu", { p_tz_offset: offset }),
    ]);

    const response: SaasMetricsResponse = {
      activeUsers: activeUsersRes.data ?? { dau: 0, wau: 0, mau: 0, dauMauRatio: 0 },
      cohortRetention: cohortRes.data ?? [],
      churn: churnRes.data ?? {
        weeklyChurnRate: 0, monthlyChurnRate: 0,
        weeklyActiveBase: 0, weeklyChurned: 0,
        monthlyActiveBase: 0, monthlyChurned: 0,
      },
      arppu: arppuRes.data ?? {
        totalRevenue: 0, payingUsers: 0, arppu: 0,
        monthlyRevenue: 0, monthlyPayingUsers: 0, monthlyArppu: 0,
      },
    };

    return apiSuccess(response);
  } catch (e) {
    return handleApiError(e);
  }
}
