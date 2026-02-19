import { NextRequest } from "next/server";
import { apiSuccess, handleApiError } from "@/lib/utils/apiError";
import { logger } from "@/lib/utils/logger";
import { sanitizeFeedbackContent } from "@/lib/utils/sanitize";
import { createFeedbackService } from "@/lib/services/factory";
import { requireOperator, requireAuth } from "@/lib/middleware/auth";
import { validateFeedbackContent } from "@/lib/validation/feedback";
import { t } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireOperator(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const feedbackService = await createFeedbackService(supabase);
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

    const feedbackService = await createFeedbackService(supabase);
    await feedbackService.submitFeedback(user.id, content);

    logger.info("Feedback submitted", {
      userId: user.id,
    });

    return apiSuccess({ message: t().feedback.submitted });
  } catch (error) {
    return handleApiError(error);
  }
}

