import { Account } from '@/lib/services/accountService';

export interface CardDistribution {
  accountId: string;
  knowledgeCode: string;
  cardTypeCode: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountRepository {
  listUsers(page: number, perPage: number): Promise<{ users: Account[]; hasMore: boolean }>;
  getUserById(userId: string): Promise<Account | null>;
  distributeCards(userId: string, cards: CardDistribution[]): Promise<{ count: number; skipped: number }>;
  getSystemDefaultCardTypeCode(): Promise<string | null>;
}