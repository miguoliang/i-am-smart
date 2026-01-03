import { FeedbackRepository, Feedback } from '@/lib/repositories/feedback.repository';

export class FeedbackService {
  constructor(private repository: FeedbackRepository) {}

  async getFeedbacks(page: number = 1, limit: number = 10): Promise<{ data: Feedback[]; total: number }> {
    return this.repository.getAll(page, limit);
  }
}
