import { ApiError } from '@/lib/utils/apiError';
import { FeedbackContent } from '@/lib/types/feedback';
import { MAX_FEEDBACK_REASON_LENGTH, MAX_FEEDBACK_OPEN_LENGTH } from '@/lib/constants';
import { t, translate } from '@/lib/i18n';

/**
 * Validates and returns sanitized feedback content
 * @throws ApiError.validationError if validation fails
 */
export function validateFeedbackContent(content: unknown): FeedbackContent {
  const translations = t();

  // Validate content is an object
  if (!content || typeof content !== "object" || Array.isArray(content)) {
    throw ApiError.validationError(translations.validation.invalidFormat);
  }

  const feedback = content as Record<string, unknown>;

  // Validate occupation
  if (!feedback.occupation || typeof feedback.occupation !== "string") {
    throw ApiError.validationError(translations.feedback.selectOccupation);
  }

  // Validate learningPurpose
  if (!Array.isArray(feedback.learningPurpose) || feedback.learningPurpose.length === 0) {
    throw ApiError.validationError(translations.feedback.selectLearningPurpose);
  }

  // Validate fragmentTimeHelpful
  if (!feedback.fragmentTimeHelpful || typeof feedback.fragmentTimeHelpful !== "string") {
    throw ApiError.validationError(translations.feedback.selectFragmentTimeHelpful);
  }

  if (feedback.fragmentTimeHelpful !== "yes" && feedback.fragmentTimeHelpful !== "no") {
    throw ApiError.validationError(translations.feedback.fragmentTimeHelpfulInvalid);
  }

  // Validate fragmentTimeNotHelpfulReason if fragmentTimeHelpful is "no"
  if (feedback.fragmentTimeHelpful === "no") {
    if (
      !feedback.fragmentTimeNotHelpfulReason ||
      typeof feedback.fragmentTimeNotHelpfulReason !== "string" ||
      feedback.fragmentTimeNotHelpfulReason.trim().length === 0
    ) {
      throw ApiError.validationError(translations.feedback.explainNotHelpful);
    }
    if (feedback.fragmentTimeNotHelpfulReason.length > MAX_FEEDBACK_REASON_LENGTH) {
      throw ApiError.validationError(
        translate(translations.feedback.reasonTooLong, { max: MAX_FEEDBACK_REASON_LENGTH })
      );
    }
  }

  // Validate willRecommend
  if (!feedback.willRecommend || typeof feedback.willRecommend !== "string") {
    throw ApiError.validationError(translations.feedback.selectWillRecommend);
  }

  if (feedback.willRecommend !== "yes" && feedback.willRecommend !== "no") {
    throw ApiError.validationError(translations.feedback.recommendInvalid);
  }

  // Validate notRecommendReason if willRecommend is "no"
  if (feedback.willRecommend === "no") {
    if (
      !feedback.notRecommendReason ||
      typeof feedback.notRecommendReason !== "string" ||
      feedback.notRecommendReason.trim().length === 0
    ) {
      throw ApiError.validationError(translations.feedback.explainNotRecommend);
    }
    if (feedback.notRecommendReason.length > MAX_FEEDBACK_REASON_LENGTH) {
      throw ApiError.validationError(
        translate(translations.feedback.notRecommendReasonTooLong, { max: MAX_FEEDBACK_REASON_LENGTH })
      );
    }
  }

  // Validate openFeedback if provided
  if (feedback.openFeedback !== undefined && typeof feedback.openFeedback !== "string") {
    throw ApiError.validationError(translations.feedback.openFeedbackInvalid);
  }

  if (
    feedback.openFeedback &&
    typeof feedback.openFeedback === "string" &&
    feedback.openFeedback.length > MAX_FEEDBACK_OPEN_LENGTH
  ) {
    throw ApiError.validationError(
      translate(translations.feedback.openFeedbackTooLong, { max: MAX_FEEDBACK_OPEN_LENGTH })
    );
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
