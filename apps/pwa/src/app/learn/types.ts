export interface KnowledgeMetadata {
  [key: string]: unknown;
}

export interface Knowledge {
  code: string;
  name: string;
  description: string;
  metadata: KnowledgeMetadata;
  pos: string;
  level: string;
  selfExaminePrompt: string;
  theme: string;
}

export interface Card {
  id: number;
  knowledge_code: string;
  knowledge: Knowledge;
  next_review_date: string;
  last_reviewed_at?: string | null; // Timestamp of last review from database
  reviewed?: boolean; // Track if card has been reviewed today (computed from last_reviewed_at)
  // SM-2 Algorithm fields
  ease_factor?: number;
  repetitions?: number;
  interval_days?: number;
}