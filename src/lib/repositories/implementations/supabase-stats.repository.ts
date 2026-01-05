import { SupabaseClient } from '@supabase/supabase-js';
import { StatsRepository, UserStats, HeatmapPoint } from '../stats.repository';

interface HeatmapRow {
  review_date: string;
  review_count: number;
}

export class SupabaseStatsRepository implements StatsRepository {
  constructor(private supabase: SupabaseClient) {}

  async getUserStats(userId: string): Promise<UserStats> {
    const { data, error } = await this.supabase
      .rpc('get_user_stats', { p_user_id: userId });

    if (error) throw error;
    
    return data as UserStats;
  }

  async getReviewHeatmap(userId: string, timezoneOffset: number): Promise<HeatmapPoint[]> {
    const { data, error } = await this.supabase
      .rpc('get_review_heatmap', { 
        p_user_id: userId, 
        p_timezone_offset: timezoneOffset 
      });

    if (error) throw error;
    
    // Postgres returns count as string (bigint), need to convert
    return (data as unknown as HeatmapRow[] || []).map((row) => ({
      date: row.review_date,
      count: Number(row.review_count)
    }));
  }
}
