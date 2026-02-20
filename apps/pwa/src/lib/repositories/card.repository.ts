import { Card } from '@/app/learn/types';

export interface ReviewCardParams {
  cardId: number;
  profileId: string;
  quality: number;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewDate: string;
}

export interface CardRepository {
  getReviewedTodayCount(profileId: string, startDate: string, endDate: string): Promise<number>;
  getDueCards(profileId: string, limit: number, level?: string): Promise<Card[]>;
  getCardById(cardId: number, profileId: string): Promise<Card | null>;
  reviewCard(params: ReviewCardParams): Promise<void>;
}
