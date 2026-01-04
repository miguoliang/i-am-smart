import { Card } from '@/app/learn/types';

export interface ReviewCardParams {
  cardId: number;
  userId: string;
  quality: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
}

export interface CardRepository {
  getReviewedTodayCount(userId: string, startDate: string, endDate: string): Promise<number>;
  getDueCards(userId: string, limit: number, level?: string): Promise<Card[]>;
  getCardById(cardId: number, userId: string): Promise<Card | null>;
  reviewCard(params: ReviewCardParams): Promise<void>;
}
