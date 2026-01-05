import { StatsRepository, UserStats, HeatmapPoint } from '@/lib/repositories/stats.repository';

export class StatsService {
  constructor(private repo: StatsRepository) {}

  async getStats(userId: string, timezoneOffset: number): Promise<{ stats: UserStats, heatmap: HeatmapPoint[] }> {
    const [stats, heatmap] = await Promise.all([
      this.repo.getUserStats(userId),
      this.repo.getReviewHeatmap(userId, timezoneOffset)
    ]);
    return { stats, heatmap };
  }
}
