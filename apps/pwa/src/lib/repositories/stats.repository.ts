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
  getUserStats(profileId: string): Promise<UserStats>;
  getReviewHeatmap(profileId: string, timezoneOffset: number): Promise<HeatmapPoint[]>;
}
