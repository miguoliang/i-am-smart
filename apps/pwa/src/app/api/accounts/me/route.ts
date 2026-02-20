import { NextRequest } from "next/server";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { MIN_DAILY_DUE_LIMIT, MAX_DAILY_DUE_LIMIT, DAILY_REVIEW_LIMIT } from "@/lib/constants";
import { t } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const { data, error } = await supabase
      .from("accounts")
      .select("username, daily_due_limit")
      .eq("id", user.id)
      .single();

    if (error) {
      throw ApiError.internal(t().settings.loadFailed);
    }

    return apiSuccess({
      username: data?.username ?? null,
      daily_due_limit: data?.daily_due_limit ?? DAILY_REVIEW_LIMIT,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  return updateAccount(req);
}

export async function PUT(req: NextRequest) {
  // Support PUT for miniprogram compatibility (miniprogram doesn't support PATCH)
  return updateAccount(req);
}

async function updateAccount(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const body = await req.json();
    const dailyDueLimit =
      typeof body.daily_due_limit === "number"
        ? body.daily_due_limit
        : parseInt(String(body.daily_due_limit ?? ""), 10);

    if (
      !Number.isInteger(dailyDueLimit) ||
      dailyDueLimit < MIN_DAILY_DUE_LIMIT ||
      dailyDueLimit > MAX_DAILY_DUE_LIMIT
    ) {
      throw ApiError.validationError(
        t().settings.dailyDueLimitRange
      );
    }

    const { error } = await supabase
      .from("accounts")
      .update({
        daily_due_limit: dailyDueLimit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      throw ApiError.internal(t().settings.updateFailed);
    }

    return apiSuccess({ daily_due_limit: dailyDueLimit });
  } catch (error) {
    return handleApiError(error);
  }
}
