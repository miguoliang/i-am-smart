import { Feedback } from '@/lib/types/feedback';

export type { Feedback };

export interface FeedbackRepository {
  getAll(page: number, limit: number): Promise<{ data: Feedback[]; total: number }>;
}
