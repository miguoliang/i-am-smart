import { NextRequest } from "next/server";
import webpush from "web-push";
import { createSupabaseAdmin } from "@/lib/supabaseAdmin";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { requireOperator } from "@/lib/middleware/auth";

if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:example@test.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/** POST: Broadcast push notification to all or specific users (operator only) */
export async function POST(req: NextRequest) {
  try {
    await requireOperator(req);

    if (!process.env.VAPID_PRIVATE_KEY) {
      throw ApiError.internal("VAPID keys not configured");
    }

    let body: { title: string; body: string; userIds?: string[] };
    try {
      body = await req.json();
    } catch {
      throw ApiError.validationError("请求体必须是 JSON");
    }

    if (!body.title || typeof body.title !== "string" || body.title.length > 200) {
      throw ApiError.validationError("title 必填且不超过 200 字");
    }
    if (!body.body || typeof body.body !== "string" || body.body.length > 1000) {
      throw ApiError.validationError("body 必填且不超过 1000 字");
    }

    const admin = createSupabaseAdmin();

    let query = admin.from("push_subscriptions").select("id, user_id, endpoint, keys");
    if (body.userIds && body.userIds.length > 0) {
      query = query.in("user_id", body.userIds);
    }

    const { data: subscriptions, error } = await query;
    if (error) throw ApiError.internal(error.message);

    if (!subscriptions || subscriptions.length === 0) {
      return apiSuccess({ sent: 0, total: 0, message: "没有可推送的订阅" });
    }

    const payload = JSON.stringify({ title: body.title, body: body.body });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          payload
        )
      )
    );

    // Clean up expired subscriptions (410 Gone)
    const gone = results
      .map((r, i) =>
        r.status === "rejected" &&
        (r.reason as { statusCode?: number })?.statusCode === 410
          ? subscriptions[i].id
          : null
      )
      .filter(Boolean);

    if (gone.length > 0) {
      await admin.from("push_subscriptions").delete().in("id", gone);
    }

    const sent = results.filter((r) => r.status === "fulfilled").length;

    return apiSuccess({ sent, total: subscriptions.length });
  } catch (e) {
    return handleApiError(e);
  }
}
