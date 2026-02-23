import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);

    const admin = createSupabaseAdmin();
    const { data, error } = await admin.rpc("get_completion_metrics");

    if (error) throw error;

    return apiSuccess(data);
  } catch (e) {
    return handleApiError(e);
  }
}
