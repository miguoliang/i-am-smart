/**
 * Shared card types for both Next.js web app and WeChat miniprogram
 */

export interface KnowledgeMetadata {
  [key: string]: unknown;
}

export interface Knowledge {
  code: string;
  name: string;
  description: string;
  metadata: KnowledgeMetadata;
}

export interface Card {
  id: number;
  knowledge_code: string;
  knowledge: Knowledge;
  next_review_date: string;
  last_reviewed_at?: string | null;
  reviewed?: boolean;
  // SM-2 Algorithm fields
  ease_factor?: number;
  repetitions?: number;
  interval_days?: number;
}

export interface DueCardsResult {
  reviewedCount: number;
  cards: Card[];
}

export interface ReviewCardResult {
  success: boolean;
  nextReview: string;
}
