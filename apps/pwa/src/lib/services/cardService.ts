import { CardRepository } from '@/lib/repositories/card.repository';
import { getTodayDateRange } from '@/lib/utils/dateUtils';
import { Card } from '@/app/learn/types';
import { SM2_ALGORITHM } from '@/lib/constants';
import { ApiError } from '@/lib/utils/apiErrorClasses';
import { t } from '@/lib/i18n';

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
 * All methods now operate on profileId instead of userId.
 */
export class CardService {
  constructor(private cardRepository: CardRepository) {}

  /**
   * Returns how many cards the profile has already reviewed today (in their timezone).
   */
  async getReviewedTodayCount(profileId: string, timezoneOffset?: number): Promise<number> {
    const { startOfToday, endOfToday } = getTodayDateRange(timezoneOffset);
    return this.cardRepository.getReviewedTodayCount(
      profileId, 
      startOfToday.toISOString(), 
      endOfToday.toISOString()
    );
  }

  /**
   * Returns due cards for the profile.
   * Accepts an optional array of levels (for exam targets that span multiple CEFR levels).
   */
  async getDueCards(
    profileId: string,
    levels?: string[],
    timezoneOffset?: number,
  ): Promise<DueCardsResult> {
    const currentReviewedCount = await this.getReviewedTodayCount(profileId, timezoneOffset);

    let cards: Card[];
    if (levels && levels.length > 1) {
      // RPC only accepts a single level, so call per level and merge
      const results = await Promise.all(
        levels.map(l => this.cardRepository.getDueCards(profileId, 9999, l))
      );
      // Merge and deduplicate by card id
      const seen = new Set<number>();
      cards = [];
      for (const batch of results) {
        for (const card of batch) {
          if (!seen.has(card.id)) {
            seen.add(card.id);
            cards.push(card);
          }
        }
      }
    } else {
      cards = await this.cardRepository.getDueCards(profileId, 9999, levels?.[0]);
    }

    return {
      reviewedCount: currentReviewedCount,
      cards,
    };
  }

  /**
   * Gets a card by ID for the profile.
   */
  async getCardById(cardId: number, profileId: string): Promise<Card | null> {
    return this.cardRepository.getCardById(cardId, profileId);
  }

  /**
   * Records a review for a card using the SM-2 spaced repetition algorithm.
   *
   * @param profileId - Learner profile ID
   * @param cardId - Card ID
   * @param quality - User rating 0–5
   * @param timezoneOffset - Minutes offset from UTC
   */
  async reviewCard(
    profileId: string,
    cardId: number,
    quality: number,
    timezoneOffset?: number,
  ): Promise<ReviewCardResult> {
    const card = await this.cardRepository.getCardById(cardId, profileId);
    if (!card) {
      throw ApiError.notFound(t().cards.cardNotFound);
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
      profileId,
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
