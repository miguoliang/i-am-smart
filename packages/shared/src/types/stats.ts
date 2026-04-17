/**
 * Shared stats types
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
