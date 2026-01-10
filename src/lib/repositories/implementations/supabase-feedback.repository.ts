import { SupabaseClient } from '@supabase/supabase-js';
import { Feedback, FeedbackRepository } from '../feedback.repository';
import { handleRepositoryError } from '../utils/error-handling';

export class SupabaseFeedbackRepository implements FeedbackRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(page: number = 1, limit: number = 10): Promise<{ data: Feedback[]; total: number }> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await this.client
      .from('feedback')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      handleRepositoryError(error, 'Get feedbacks');
    }

    return {
      data: (data as Feedback[]) || [],
      total: count || 0,
    };
  }
}
