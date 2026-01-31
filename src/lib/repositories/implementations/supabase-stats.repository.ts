import { SupabaseClient } from '@supabase/supabase-js';
import { StatsRepository, UserStats, HeatmapPoint } from '../stats.repository';
import { handleRepositoryError } from '../utils/error-handling';
import { validateUserStats } from '../utils/validation';

interface HeatmapRow {
  review_date: string;
  // Postgres bigint can be returned as string (node-pg) or number (PostgREST/Supabase)
  review_count: string | number;
}

export class SupabaseStatsRepository implements StatsRepository {
  constructor(private supabase: SupabaseClient) {}

  async getUserStats(userId: string): Promise<UserStats> {
    const { data, error } = await this.supabase
      .rpc('get_user_stats', { p_user_id: userId });

    if (error) {
      handleRepositoryError(error, 'Get user stats');
    }

    if (!data) {
      throw new Error('Get user stats error: No data returned');
    }
    
    return validateUserStats(data);
  }

  async getReviewHeatmap(userId: string, timezoneOffset: number): Promise<HeatmapPoint[]> {
    const { data, error } = await this.supabase
      .rpc('get_review_heatmap', { 
        p_user_id: userId, 
        p_timezone_offset: timezoneOffset 
      });

    if (error) throw error;
    
    if (!data) {
      return [];
    }

    if (!Array.isArray(data)) {
      throw new Error('Expected array from get_review_heatmap RPC');
    }

    // Postgres bigint may return as string (node-pg) or number (PostgREST/Supabase)
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
