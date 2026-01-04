import { CardRepository } from '@/lib/repositories/card.repository';
import { getTodayDateRange } from '@/lib/utils/dateUtils';
import { Card } from '@/app/learn/types';
import { DAILY_REVIEW_LIMIT } from '@/lib/constants';
import { ApiError } from '@/lib/utils/apiErrorClasses';

export interface DueCardsResult {
  reviewedCount: number;
  cards: Card[];
}

export interface ReviewCardResult {
  success: boolean;
  nextReview: string;
}

export class CardService {
  constructor(private cardRepository: CardRepository) {}

  async getReviewedTodayCount(userId: string): Promise<number> {
    const { startOfToday, endOfToday } = getTodayDateRange();
    return this.cardRepository.getReviewedTodayCount(
      userId, 
      startOfToday.toISOString(), 
      endOfToday.toISOString()
    );
  }

  async getDueCards(userId: string, level?: string): Promise<DueCardsResult> {
    const currentReviewedCount = await this.getReviewedTodayCount(userId);

    if (currentReviewedCount >= DAILY_REVIEW_LIMIT) {
      return {
        reviewedCount: DAILY_REVIEW_LIMIT,
        cards: [],
      };
    }

    const remainingSlots = DAILY_REVIEW_LIMIT - currentReviewedCount;
    const cards = await this.cardRepository.getDueCards(userId, remainingSlots, level);

    return {
      reviewedCount: currentReviewedCount,
      cards,
    };
  }

  async reviewCard(userId: string, cardId: number, quality: number): Promise<ReviewCardResult> {
    // 1. Fetch card
    const card = await this.cardRepository.getCardById(cardId, userId);
    if (!card) {
      throw ApiError.notFound('卡片不存在');
    }

    // 2. Check daily limit
    const { startOfToday, endOfToday } = getTodayDateRange();
    
    // Check if this card was already reviewed today
    const isCardReviewedToday =
      card.last_reviewed_at &&
      new Date(card.last_reviewed_at) >= startOfToday &&
      new Date(card.last_reviewed_at) <= endOfToday;

    if (!isCardReviewedToday) {
      const reviewedTodayCount = await this.getReviewedTodayCount(userId);
      if (reviewedTodayCount >= DAILY_REVIEW_LIMIT) {
        throw ApiError.dailyLimitExceeded(`今日已复习${DAILY_REVIEW_LIMIT}张卡片，已达到每日限制`);
      }
    }

    // 3. SM-2 Algorithm
    let newEase = Number(card.ease_factor || 2.5);
    let newReps = Number(card.repetitions || 0);
    let newInterval = Number(card.interval_days || 0);

    if (quality >= 3) {
      // Correct answer
      if (newReps === 0) newInterval = 1;
      else if (newReps === 1) newInterval = 6;
      else newInterval = Math.round(newInterval * newEase);

      newReps += 1;
    } else {
      // Incorrect, reset
      newReps = 0;
      newInterval = 1;
    }

    // Adjust Ease Factor
    newEase += 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
    if (newEase < 1.3) newEase = 1.3;

    const nextReview = new Date();
    nextReview.setUTCDate(nextReview.getUTCDate() + newInterval);
    nextReview.setUTCHours(0, 0, 0, 0);

    // 4. Update via Repository
    await this.cardRepository.reviewCard({
      cardId,
      userId,
      quality,
      easeFactor: parseFloat(newEase.toFixed(2)),
      intervalDays: newInterval,
      repetitions: newReps,
      nextReviewDate: nextReview.toISOString(),
    });

    return {
      success: true,
      nextReview: nextReview.toISOString(),
    };
  }
}
