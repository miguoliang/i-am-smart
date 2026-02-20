import { StatsRepository, UserStats, HeatmapPoint } from '@/lib/repositories/stats.repository';

export class StatsService {
  constructor(private repo: StatsRepository) {}

  async getStats(profileId: string, timezoneOffset: number): Promise<{ stats: UserStats, heatmap: HeatmapPoint[] }> {
    const [stats, heatmap] = await Promise.all([
      this.repo.getUserStats(profileId),
      this.repo.getReviewHeatmap(profileId, timezoneOffset)
    ]);
    return { stats, heatmap };
  }
}
