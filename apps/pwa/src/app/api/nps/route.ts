import { NextRequest } from "next/server";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);
    const { score, comment } = await req.json();

    if (typeof score !== "number" || score < 0 || score > 10) {
      throw ApiError.validationError("评分必须在 0-10 之间");
    }

    // Check if user already rated in last 30 days
    const { data: recent } = await supabase
      .from("nps_ratings")
      .select("id")
      .eq("account_id", user.id)
      .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (recent && recent.length > 0) {
      throw ApiError.validationError("每 30 天只能评分一次");
    }

    const { error } = await supabase.from("nps_ratings").insert({
      account_id: user.id,
      score,
      comment: comment?.trim() || null,
    });

    if (error) throw error;

    return apiSuccess({ message: "感谢评分！" });
  } catch (e) {
    return handleApiError(e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    // Check if user can rate (hasn't rated in 30 days)
    const { data: recent } = await supabase
      .from("nps_ratings")
      .select("id, created_at")
      .eq("account_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    const canRate = !recent || recent.length === 0 ||
      Date.now() - new Date(recent[0].created_at).getTime() > 30 * 24 * 60 * 60 * 1000;

    return apiSuccess({ canRate });
  } catch (e) {
    return handleApiError(e);
  }
}
