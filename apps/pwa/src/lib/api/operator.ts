import { parseApiErrorResponse } from "@/lib/utils/apiError";

export interface DayMetric {
  date: string;
  count: number;
}

export interface DayRevenue {
  date: string;
  amount: number;
}

export interface DashboardData {
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

export async function fetchDashboard(offset: number): Promise<DashboardData> {
  const res = await fetch(`/api/operator/dashboard?offset=${offset}`);
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "获取仪表盘数据失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

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

export async function fetchUserDetail(id: string): Promise<UserDetailResponse> {
  const res = await fetch(`/api/operator/accounts/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "获取用户详情失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

export async function banUser(id: string, banned: boolean): Promise<{ banned: boolean }> {
  const res = await fetch(`/api/operator/accounts/${encodeURIComponent(id)}/ban`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ banned }),
  });
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, banned ? "封禁用户失败" : "解封用户失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}

export interface OrderQueryParams {
  page?: number;
  perPage?: number;
  status?: "pending" | "paid" | "failed" | "all";
  channel?: "wechat" | "alipay" | "all";
  startDate?: string;
  endDate?: string;
}

export interface OrderRow {
  out_trade_no: string;
  status: string;
  amount_total: number;
  description: string | null;
  channel: string | null;
  account_id: string | null;
  created_at: string;
  paid_at: string | null;
}

export interface OrdersResponse {
  orders: OrderRow[];
  total: number;
  summary: { totalAmount: number; count: number };
}

export async function fetchOrders(params: OrderQueryParams = {}): Promise<OrdersResponse> {
  const searchParams = new URLSearchParams();
  if (params.page != null) searchParams.set("page", String(params.page));
  if (params.perPage != null) searchParams.set("perPage", String(params.perPage));
  if (params.status) searchParams.set("status", params.status);
  if (params.channel) searchParams.set("channel", params.channel);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);

  const res = await fetch(`/api/operator/orders?${searchParams.toString()}`);
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "获取订单列表失败");
    throw new Error(message);
  }
  const json = await res.json();
  return json.data;
}
