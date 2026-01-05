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

export interface StatsRepository {
  getUserStats(userId: string): Promise<UserStats>;
  getReviewHeatmap(userId: string, timezoneOffset: number): Promise<HeatmapPoint[]>;
}
