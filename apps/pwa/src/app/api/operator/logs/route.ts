import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

/** GET: List operator audit logs */
export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") ?? "20", 10)));

    const admin = createSupabaseAdmin();
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await admin
      .from("operator_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return apiSuccess({
      logs: data ?? [],
      total: count ?? 0,
    });
  } catch (e) {
    return handleApiError(e);
  }
}
