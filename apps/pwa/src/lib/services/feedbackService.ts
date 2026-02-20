import { FeedbackRepository, Feedback } from '@/lib/repositories/feedback.repository';
import { FeedbackContent } from '@/lib/types/feedback';

export class FeedbackService {
  constructor(private repository: FeedbackRepository) {}

  async getFeedbacks(page: number = 1, limit: number = 10): Promise<{ data: Feedback[]; total: number }> {
    return this.repository.getAll(page, limit);
  }

  async submitFeedback(userId: string, content: FeedbackContent): Promise<void> {
    await this.repository.create(userId, content);
  }
}
