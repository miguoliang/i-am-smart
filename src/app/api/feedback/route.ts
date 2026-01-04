import { createRouteHandlerClient } from "@/lib/supabaseServer";
import { NextRequest } from "next/server";
import { apiSuccess, handleApiError, ApiError } from "@/lib/utils/apiError";
import { logger } from "@/lib/utils/logger";
import { sanitizeFeedbackContent } from "@/lib/utils/sanitize";
import { createFeedbackService } from "@/lib/services/factory";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw ApiError.unauthorized("未登录");
    }

    // Check if user is operator
    if (user.app_metadata?.role !== 'operator') {
      throw ApiError.forbidden("无权访问");
    }

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
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { content: rawContent } = await req.json();

    if (!rawContent || typeof rawContent !== "object" || Array.isArray(rawContent)) {
      throw ApiError.validationError("反馈内容格式无效");
    }

    const content = sanitizeFeedbackContent(rawContent);

    // Validate required fields in content
    if (!content.occupation || typeof content.occupation !== "string") {
      throw ApiError.validationError("请选择您的职业");
    }

    if (!Array.isArray(content.learningPurpose) || content.learningPurpose.length === 0) {
      throw ApiError.validationError("请至少选择一个英语学习的目的");
    }

    if (!content.fragmentTimeHelpful || typeof content.fragmentTimeHelpful !== "string") {
      throw ApiError.validationError("请选择这个app对充分利用碎片时间是否有帮助");
    }

    if (content.fragmentTimeHelpful === "no") {
      if (!content.fragmentTimeNotHelpfulReason || typeof content.fragmentTimeNotHelpfulReason !== "string" || content.fragmentTimeNotHelpfulReason.trim().length === 0) {
        throw ApiError.validationError("请说明为什么觉得没有帮助");
      }
      if (content.fragmentTimeNotHelpfulReason.length > 1000) {
        throw ApiError.validationError("原因不能超过1000字");
      }
    }

    if (content.fragmentTimeHelpful !== "yes" && content.fragmentTimeHelpful !== "no") {
      throw ApiError.validationError("碎片时间帮助选择无效");
    }

    if (!content.willRecommend || typeof content.willRecommend !== "string") {
      throw ApiError.validationError("请选择是否会推荐给朋友");
    }

    if (content.willRecommend !== "yes" && content.willRecommend !== "no") {
      throw ApiError.validationError("推荐选择无效");
    }

    if (content.willRecommend === "no") {
      if (!content.notRecommendReason || typeof content.notRecommendReason !== "string" || content.notRecommendReason.trim().length === 0) {
        throw ApiError.validationError("请说明不推荐的原因");
      }
      if (content.notRecommendReason.length > 1000) {
        throw ApiError.validationError("不推荐原因不能超过1000字");
      }
    }

    // Validate openFeedback if provided
    if (content.openFeedback !== undefined && typeof content.openFeedback !== "string") {
      throw ApiError.validationError("开放意见格式无效");
    }

    if (content.openFeedback && content.openFeedback.length > 2000) {
      throw ApiError.validationError("开放意见不能超过2000字");
    }

    const { error } = await supabase
      .from("feedback")
      .insert({
        user_id: user?.id || null,
        content: content,
      });

    if (error) {
      logger.error("Feedback POST: Database error", { error });
      throw ApiError.internal("提交反馈失败，请稍后重试");
    }

    logger.info("Feedback submitted", {
      userId: user?.id || "anonymous",
    });

    return apiSuccess({ message: "反馈已提交，感谢您的建议！" });
  } catch (error) {
    return handleApiError(error);
  }
}

