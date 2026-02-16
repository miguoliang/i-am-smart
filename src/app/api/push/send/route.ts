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

    // Cleanup failed subscriptions (410 Gone means unsubscribed)
    // In a real app, you'd delete them from the DB here.
    
    const successful = results.filter(r => r.status === 'fulfilled').length;

    return apiSuccess({ 
      message: `Sent ${successful} of ${subscriptions.length} notifications`,
      results 
    });

  } catch (error) {
    return handleApiError(error);
  }
}
