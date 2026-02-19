import { NextRequest } from "next/server";
import webpush from "web-push";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireAuth } from "@/lib/middleware/auth";
import { t } from "@/lib/i18n";

// Initialize web-push if keys are available (avoids build errors)
if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@test.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.VAPID_PRIVATE_KEY) {
       throw new Error("VAPID keys not configured");
    }

    const { user, supabase } = await requireAuth(req);

    const { title, body } = await req.json();

    if (!title || typeof title !== 'string' || title.length > 200) {
      throw ApiError.validationError("title is required and must be at most 200 characters");
    }
    if (!body || typeof body !== 'string' || body.length > 1000) {
      throw ApiError.validationError("body is required and must be at most 1000 characters");
    }

    // Get user subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      throw ApiError.notFound(t().validation.noSubscriptionsFound);
    }

    // Send notifications
    const results = await Promise.allSettled(
      subscriptions.map(sub => 
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys
          },
          JSON.stringify({ title, body })
        )
      )
    );

    // Clean up expired subscriptions (410 Gone)
    const gone = results
      .map((r, i) => r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410 ? subscriptions[i].id : null)
      .filter(Boolean);
    if (gone.length > 0) {
      await supabase.from('push_subscriptions').delete().in('id', gone);
    }

    const successful = results.filter(r => r.status === 'fulfilled').length;

    return apiSuccess({ 
      message: `Sent ${successful} of ${subscriptions.length} notifications`,
      results 
    });

  } catch (error) {
    return handleApiError(error);
  }
}
