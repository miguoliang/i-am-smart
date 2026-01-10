import { ApiError } from '@/lib/utils/apiError';
import { FeedbackContent } from '@/lib/types/feedback';
import { MAX_FEEDBACK_REASON_LENGTH, MAX_FEEDBACK_OPEN_LENGTH } from '@/lib/constants';

/**
 * Validates and returns sanitized feedback content
 * @throws ApiError.validationError if validation fails
 */
export function validateFeedbackContent(content: unknown): FeedbackContent {
  // Validate content is an object
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw ApiError.validationError("反馈内容格式无效");
  }

  const feedback = content as Record<string, unknown>;

  // Validate occupation
  if (!feedback.occupation || typeof feedback.occupation !== "string") {
    throw ApiError.validationError("请选择您的职业");
  }

  // Validate learningPurpose
  if (!Array.isArray(feedback.learningPurpose) || feedback.learningPurpose.length === 0) {
    throw ApiError.validationError("请至少选择一个英语学习的目的");
  }

  // Validate fragmentTimeHelpful
  if (!feedback.fragmentTimeHelpful || typeof feedback.fragmentTimeHelpful !== "string") {
    throw ApiError.validationError("请选择这个app对充分利用碎片时间是否有帮助");
  }

  if (feedback.fragmentTimeHelpful !== "yes" && feedback.fragmentTimeHelpful !== "no") {
    throw ApiError.validationError("碎片时间帮助选择无效");
  }

  // Validate fragmentTimeNotHelpfulReason if fragmentTimeHelpful is "no"
  if (feedback.fragmentTimeHelpful === "no") {
    if (
      !feedback.fragmentTimeNotHelpfulReason ||
      typeof feedback.fragmentTimeNotHelpfulReason !== "string" ||
      feedback.fragmentTimeNotHelpfulReason.trim().length === 0
    ) {
      throw ApiError.validationError("请说明为什么觉得没有帮助");
    }
    if (feedback.fragmentTimeNotHelpfulReason.length > MAX_FEEDBACK_REASON_LENGTH) {
      throw ApiError.validationError(`原因不能超过${MAX_FEEDBACK_REASON_LENGTH}字`);
    }
  }

  // Validate willRecommend
  if (!feedback.willRecommend || typeof feedback.willRecommend !== "string") {
    throw ApiError.validationError("请选择是否会推荐给朋友");
  }

  if (feedback.willRecommend !== "yes" && feedback.willRecommend !== "no") {
    throw ApiError.validationError("推荐选择无效");
  }

  // Validate notRecommendReason if willRecommend is "no"
  if (feedback.willRecommend === "no") {
    if (
      !feedback.notRecommendReason ||
      typeof feedback.notRecommendReason !== "string" ||
      feedback.notRecommendReason.trim().length === 0
    ) {
      throw ApiError.validationError("请说明不推荐的原因");
    }
    if (feedback.notRecommendReason.length > MAX_FEEDBACK_REASON_LENGTH) {
      throw ApiError.validationError(`不推荐原因不能超过${MAX_FEEDBACK_REASON_LENGTH}字`);
    }
  }

  // Validate openFeedback if provided
  if (feedback.openFeedback !== undefined && typeof feedback.openFeedback !== "string") {
    throw ApiError.validationError("开放意见格式无效");
  }

  if (
    feedback.openFeedback &&
    typeof feedback.openFeedback === "string" &&
    feedback.openFeedback.length > MAX_FEEDBACK_OPEN_LENGTH
  ) {
    throw ApiError.validationError(`开放意见不能超过${MAX_FEEDBACK_OPEN_LENGTH}字`);
  }

  // Return validated content with proper types
  return {
    occupation: feedback.occupation as string,
    learningPurpose: feedback.learningPurpose as string[],
    fragmentTimeHelpful: feedback.fragmentTimeHelpful as "yes" | "no",
    fragmentTimeNotHelpfulReason: feedback.fragmentTimeNotHelpfulReason as string | undefined,
    willRecommend: feedback.willRecommend as "yes" | "no",
    notRecommendReason: feedback.notRecommendReason as string | undefined,
    openFeedback: feedback.openFeedback as string | undefined,
  };
}
