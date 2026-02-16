/**
 * Shared stats types for both Next.js web app and WeChat miniprogram
 */

export interface UserStats {
  totalCards: number;
  masteredCards: number;
  learningCards: number;
  newCards: number;
  reviewStreak: number;
  lastReviewDate: string | null;
}

export interface HeatmapPoint {
  date: string;
  count: number;
}

export interface StatsData {
  stats: UserStats;
  heatmap: HeatmapPoint[];
}
