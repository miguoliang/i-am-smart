import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";

/** POST: Regenerate calendar token (invalidates old subscriptions) */
export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const { data, error } = await supabase
      .from("accounts")
      .update({ calendar_token: crypto.randomUUID(), updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("calendar_token")
      .single();

    if (error) {
      throw new Error("重新生成日历令牌失败");
    }

    return apiSuccess({ calendar_token: data.calendar_token });
  } catch (error) {
    return handleApiError(error);
  }
}
