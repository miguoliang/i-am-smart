import { NextRequest } from "next/server";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { createProfileService } from "@/lib/services/factory";
import { MIN_DAILY_DUE_LIMIT, MAX_DAILY_DUE_LIMIT, DAILY_REVIEW_LIMIT } from "@/lib/constants";
import { t } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const { data, error } = await supabase
      .from("accounts")
      .select("username, daily_due_limit, plan, calendar_token, calendar_remind_hour")
      .eq("id", user.id)
      .single();

    if (error) {
      throw ApiError.internal(t().settings.loadFailed);
    }

    const profileService = await createProfileService(supabase);
    const profiles = await profileService.getProfiles(user.id);

    return apiSuccess({
      username: data?.username ?? null,
      daily_due_limit: data?.daily_due_limit ?? DAILY_REVIEW_LIMIT,
      plan: data?.plan ?? 'free',
      calendar_token: data?.calendar_token ?? null,
      calendar_remind_hour: data?.calendar_remind_hour ?? 9,
      profiles,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: NextRequest) {
  return updateAccount(req);
}

export async function PUT(req: NextRequest) {
  return updateAccount(req);
}

async function updateAccount(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const body = await req.json();
    const updates: Record<string, unknown> = {};

    // daily_due_limit
    if (body.daily_due_limit !== undefined) {
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
      updates.daily_due_limit = dailyDueLimit;
    }

    // calendar_remind_hour
    if (body.calendar_remind_hour !== undefined) {
      const hour = typeof body.calendar_remind_hour === "number"
        ? body.calendar_remind_hour
        : parseInt(String(body.calendar_remind_hour), 10);

      if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
        throw ApiError.validationError("提醒时间必须在 0-23 之间");
      }
      updates.calendar_remind_hour = hour;
    }

    if (Object.keys(updates).length === 0) {
      throw ApiError.validationError("没有需要更新的字段");
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("accounts")
      .update(updates)
      .eq("id", user.id);

    if (error) {
      throw ApiError.internal(t().settings.updateFailed);
    }

    return apiSuccess(updates);
  } catch (error) {
    return handleApiError(error);
  }
}
