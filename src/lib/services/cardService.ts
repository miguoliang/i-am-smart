import { CardRepository } from '@/lib/repositories/card.repository';
import { getTodayDateRange } from '@/lib/utils/dateUtils';
import { Card } from '@/app/learn/types';
import { DAILY_REVIEW_LIMIT, SM2_ALGORITHM } from '@/lib/constants';
import { ApiError } from '@/lib/utils/apiErrorClasses';
import { t, translate } from '@/lib/i18n';

export interface DueCardsResult {
  reviewedCount: number;
  cards: Card[];
}

export interface ReviewCardResult {
  success: boolean;
  nextReview: string;
}

/**
 * Card service: due cards, today's review count, and card review (SM-2).
 */
export class CardService {
  constructor(private cardRepository: CardRepository) {}

  /**
   * Returns how many cards the user has already reviewed today (in their timezone).
   */
  async getReviewedTodayCount(userId: string, timezoneOffset?: number): Promise<number> {
    const { startOfToday, endOfToday } = getTodayDateRange(timezoneOffset);
    return this.cardRepository.getReviewedTodayCount(
      userId, 
      startOfToday.toISOString(), 
      endOfToday.toISOString()
    );
  }

  /**
   * Returns due cards for the user, respecting the daily review limit.
   * If the user has already reached the limit today, returns an empty list.
   */
  async getDueCards(userId: string, level?: string, timezoneOffset?: number): Promise<DueCardsResult> {
    const currentReviewedCount = await this.getReviewedTodayCount(userId, timezoneOffset);

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

  /**
   * Records a review for a card using the SM-2 spaced repetition algorithm.
   *
   * Steps: (1) load card and enforce daily limit, (2) compute new interval/ease/reps via SM-2,
   * (3) persist via repository.
   *
   * @see https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm
   * @param userId - Account ID
   * @param cardId - Card ID
   * @param quality - User rating 0–5: 0–2 = incorrect, 3–5 = correct (higher = easier)
   * @param timezoneOffset - Minutes offset from UTC (e.g. from Date.getTimezoneOffset()) for “today”
   * @returns Next review date (ISO string) and success
   * @throws ApiError.notFound if card missing, ApiError.dailyLimitExceeded if daily limit reached
   */
  async reviewCard(userId: string, cardId: number, quality: number, timezoneOffset?: number): Promise<ReviewCardResult> {
    const card = await this.cardRepository.getCardById(cardId, userId);
    if (!card) {
      throw ApiError.notFound(t().cards.cardNotFound);
    }

    const { startOfToday, endOfToday } = getTodayDateRange(timezoneOffset);
    const isCardReviewedToday =
      card.last_reviewed_at &&
      new Date(card.last_reviewed_at) >= startOfToday &&
      new Date(card.last_reviewed_at) <= endOfToday;

    if (!isCardReviewedToday) {
      const reviewedTodayCount = await this.getReviewedTodayCount(userId, timezoneOffset);
      if (reviewedTodayCount >= DAILY_REVIEW_LIMIT) {
        throw ApiError.dailyLimitExceeded(
          translate(t().cards.dailyLimitExceeded, { limit: DAILY_REVIEW_LIMIT })
        );
      }
    }

    /** SM-2: compute new ease factor, repetitions, and interval from quality (0–5). */
    let newEase = Number(card.ease_factor ?? SM2_ALGORITHM.DEFAULT_EASE_FACTOR);
    let newReps = Number(card.repetitions ?? 0);
    let newInterval = Number(card.interval_days ?? 0);

    if (quality >= SM2_ALGORITHM.QUALITY_THRESHOLD) {
      if (newReps === 0) newInterval = SM2_ALGORITHM.FIRST_INTERVAL;
      else if (newReps === 1) newInterval = SM2_ALGORITHM.SECOND_INTERVAL;
      else newInterval = Math.round(newInterval * newEase);
      newReps += 1;
    } else {
      newReps = 0;
      newInterval = SM2_ALGORITHM.FIRST_INTERVAL;
    }

    newEase += SM2_ALGORITHM.EASE_ADJUSTMENT_BASE - 
      (SM2_ALGORITHM.MAX_QUALITY - quality) * 
      (SM2_ALGORITHM.EASE_ADJUSTMENT_FACTOR + 
       (SM2_ALGORITHM.MAX_QUALITY - quality) * SM2_ALGORITHM.EASE_ADJUSTMENT_PENALTY);
    if (newEase < SM2_ALGORITHM.MIN_EASE_FACTOR) newEase = SM2_ALGORITHM.MIN_EASE_FACTOR;

    const nextReview = new Date();
    nextReview.setUTCDate(nextReview.getUTCDate() + newInterval);
    nextReview.setUTCHours(0, 0, 0, 0);

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