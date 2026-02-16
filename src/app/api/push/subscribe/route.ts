import { NextRequest } from "next/server";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { t } from "@/lib/i18n";

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const subscription = await req.json();

    if (!subscription || !subscription.endpoint) {
        throw ApiError.validationError(t().validation.invalidSubscriptionObject);
    }

    // Save to DB
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        keys: subscription.keys
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    return apiSuccess({ message: "Subscription saved" });
  } catch (error) {
    return handleApiError(error);
  }
}
