export const DAILY_REVIEW_LIMIT = 10;
export const MAX_QUALITY = 5;
export const MIN_QUALITY = 0;

// Pagination limits
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 10;

// Feedback validation limits
export const MAX_FEEDBACK_REASON_LENGTH = 1000;
export const MAX_FEEDBACK_OPEN_LENGTH = 2000;

// Knowledge repository limits
export const DEFAULT_KNOWLEDGE_LIMIT = 1000;

/**
 * SM-2 algorithm constants for spaced repetition card scheduling.
 * @see https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm
 */
export const SM2_ALGORITHM = {
  /** Default ease factor for new cards */
  DEFAULT_EASE_FACTOR: 2.5,
  /** Interval in days for first successful review (reps=0) */
  FIRST_INTERVAL: 1,
  /** Interval in days for second successful review (reps=1) */
  SECOND_INTERVAL: 6,
  /** Minimum quality rating considered "correct" (3-5 = correct, 0-2 = incorrect) */
  QUALITY_THRESHOLD: 3,
  /** Minimum allowed ease factor to prevent scheduling from degrading too much */
  MIN_EASE_FACTOR: 1.3,
  /** Base adjustment added to ease factor */
  EASE_ADJUSTMENT_BASE: 0.1,
  /** Factor multiplied by (5 - quality) in ease adjustment formula */
  EASE_ADJUSTMENT_FACTOR: 0.08,
  /** Penalty multiplied by (5 - quality)² in ease adjustment formula */
  EASE_ADJUSTMENT_PENALTY: 0.02,
  /** Maximum quality value in rating scale */
  MAX_QUALITY: 5,
} as const;
