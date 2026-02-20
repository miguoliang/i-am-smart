/**
 * Shared stats types for both Next.js web app and WeChat miniprogram
 */

export interface UserStats {
  total: number;
  mastered: number;
  learning: number;
  dueToday: number;
}

export interface HeatmapPoint {
  date: string;
  count: number;
}

export interface StatsData {
  stats: UserStats;
  heatmap: HeatmapPoint[];
}
