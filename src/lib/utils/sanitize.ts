import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Create DOMPurify instance for server-side use
const window = new JSDOM('').window;
const purify = DOMPurify(window);

/**
 * Sanitize plain text (removes HTML and normalizes whitespace)
 */
export function sanitizeText(text: string): string {
  if (typeof text !== 'string') {
    return '';
  }
  
  // Remove HTML tags
  const withoutHtml = purify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
  
  // Normalize whitespace (trim and replace multiple spaces with single space)
  return withoutHtml.trim().replace(/\s+/g, ' ');
}

/**
 * Sanitize feedback content object
 */
export interface FeedbackContent {
  occupation?: string;
  learningPurpose?: string[];
  fragmentTimeHelpful?: string;
  fragmentTimeNotHelpfulReason?: string;
  willRecommend?: string;
  notRecommendReason?: string;
  openFeedback?: string;
}

export function sanitizeFeedbackContent(content: FeedbackContent): FeedbackContent {
  const sanitized: FeedbackContent = {};

  if (content.occupation) {
    sanitized.occupation = sanitizeText(content.occupation);
  }

  if (content.learningPurpose && Array.isArray(content.learningPurpose)) {
    sanitized.learningPurpose = content.learningPurpose
      .map(p => sanitizeText(p))
      .filter(p => p.length > 0);
  }

  if (content.fragmentTimeHelpful) {
    sanitized.fragmentTimeHelpful = sanitizeText(content.fragmentTimeHelpful);
  }

  if (content.fragmentTimeNotHelpfulReason) {
    sanitized.fragmentTimeNotHelpfulReason = sanitizeText(content.fragmentTimeNotHelpfulReason);
  }

  if (content.willRecommend) {
    sanitized.willRecommend = sanitizeText(content.willRecommend);
  }

  if (content.notRecommendReason) {
    sanitized.notRecommendReason = sanitizeText(content.notRecommendReason);
  }

  if (content.openFeedback) {
    sanitized.openFeedback = sanitizeText(content.openFeedback);
  }

  return sanitized;
}
