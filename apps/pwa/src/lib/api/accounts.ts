// API functions for accounts
import { parseApiErrorResponse } from "@/lib/utils/apiError";

export interface Account {
  id: string;
  username: string;
  email?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
  dailyReviewCount?: number;
}

export interface AccountsResponse {
  accounts: Account[];
  pagination: {
    page: number;
    perPage: number;
    hasMore: boolean;
  };
}

export async function fetchAccounts(
  page: number = 1,
  perPage: number = 10,
  search?: string
): Promise<AccountsResponse> {
  const params = new URLSearchParams({ page: String(page), perPage: String(perPage) });
  if (search?.trim()) params.set("search", search.trim());
  const res = await fetch(`/api/accounts?${params.toString()}`);
  if (!res.ok) {
    const message = await parseApiErrorResponse(res, "Failed to fetch accounts");
    throw new Error(message);
  }
  const json = await res.json();
  // API returns { data: {...} }, extract the data object
  return json.data;
}

