import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest } from "next/server";
import webpush from "web-push";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";

export async function POST(req: NextRequest) {
  // Initialize web-push lazily to avoid build errors
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@test.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw ApiError.unauthorized("Unauthorized");
    }

    const { title, body } = await req.json();

    // Get user subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      throw ApiError.notFound("No subscriptions found");
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
