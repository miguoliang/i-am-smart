import { Account } from '@/lib/services/accountService';

export interface AccountRepository {
  listUsers(
    page: number,
    perPage: number,
    search?: string
  ): Promise<{ users: Account[]; hasMore: boolean }>;
  getUserById(userId: string): Promise<Account | null>;
  getAccountsDailyReviewCounts(): Promise<{ accountId: string; reviewCount: number }[]>;
}