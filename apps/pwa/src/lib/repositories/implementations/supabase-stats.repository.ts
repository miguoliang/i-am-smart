import { SupabaseClient } from '@supabase/supabase-js';
import { StatsRepository, UserStats, HeatmapPoint } from '../stats.repository';
import { handleRepositoryError } from '../utils/error-handling';
import { validateUserStats } from '../utils/validation';

interface HeatmapRow {
  review_date: string;
  review_count: string | number;
}

export class SupabaseStatsRepository implements StatsRepository {
  constructor(private supabase: SupabaseClient) {}

  async getUserStats(profileId: string): Promise<UserStats> {
    const { data, error } = await this.supabase
      .rpc('get_profile_stats', { p_profile_id: profileId });

    if (error) {
      handleRepositoryError(error, 'Get user stats');
    }

    if (!data) {
      throw new Error('Get user stats error: No data returned');
    }
    
    return validateUserStats(data);
  }

  async getReviewHeatmap(profileId: string, timezoneOffset: number): Promise<HeatmapPoint[]> {
    const { data, error } = await this.supabase
      .rpc('get_profile_review_heatmap', { 
        p_profile_id: profileId, 
        p_timezone_offset: timezoneOffset 
      });

    if (error) throw error;
    
    if (!data) {
      return [];
    }

    if (!Array.isArray(data)) {
      throw new Error('Expected array from get_profile_review_heatmap RPC');
    }

    return data.map((row: HeatmapRow) => {
      if (!row.review_date || typeof row.review_date !== 'string') {
        throw new Error(`Invalid heatmap row: missing or invalid review_date`);
      }

      if (row.review_count == null) {
        throw new Error(`Invalid heatmap row: missing review_count`);
      }

      const count =
        typeof row.review_count === 'string'
          ? parseInt(row.review_count, 10)
          : Math.floor(Number(row.review_count));
      if (isNaN(count) || count < 0) {
        throw new Error(`Invalid heatmap row: invalid review_count value: ${row.review_count}`);
      }

      return {
        date: row.review_date,
        count,
      };
    });
  }
}
