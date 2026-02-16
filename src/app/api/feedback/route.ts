import { NextRequest } from "next/server";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { logger } from "@/lib/utils/logger";
import { sanitizeFeedbackContent } from "@/lib/utils/sanitize";
import { createFeedbackService } from "@/lib/services/factory";
import { requireOperator, requireAuth } from "@/lib/middleware/auth";
import { validateFeedbackContent } from "@/lib/validation/feedback";
import { t } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  try {
    await requireOperator(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const feedbackService = await createFeedbackService();
    const result = await feedbackService.getFeedbacks(page, limit);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const { content: rawContent } = await req.json();

    // Validate feedback content
    const validatedContent = validateFeedbackContent(rawContent);

    // Sanitize validated content
    const content = sanitizeFeedbackContent(validatedContent);

    const { error } = await supabase
      .from("feedback")
      .insert({
        user_id: user?.id || null,
        content: content,
      });

    if (error) {
      logger.error("Feedback POST: Database error", { error });
      throw ApiError.internal(t().feedback.submitFailed);
    }

    logger.info("Feedback submitted", {
      userId: user?.id || "anonymous",
    });

    return apiSuccess({ message: t().feedback.submitted });
  } catch (error) {
    return handleApiError(error);
  }
}

