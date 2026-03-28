import { SupabaseClient } from '@supabase/supabase-js';
import { CardRepository, ReviewCardParams } from '../card.repository';
import type { Card } from '@/app/learn/types';
import { handleRepositoryError } from '../utils/error-handling';
import { CardRowSchema } from '../schemas/card.schema';

export class SupabaseCardRepository implements CardRepository {
  constructor(private client: SupabaseClient) {}

  async getReviewedTodayCount(profileId: string, startDate: string, endDate: string): Promise<number> {
    const { count, error } = await this.client
      .from('account_cards')
      .select('*', { count: 'exact', head: true })
      .eq('profile_id', profileId)
      .gte('last_reviewed_at', startDate)
      .lte('last_reviewed_at', endDate);

    if (error) {
      handleRepositoryError(error, 'Count reviewed today');
    }

    return count ?? 0;
  }

  async getDueCards(profileId: string, limit: number, level?: string): Promise<Card[]> {
    const { data, error } = await this.client
      .rpc('get_due_cards_by_profile', {
        p_profile_id: profileId,
        p_limit: limit,
        p_level: level,
      })
      .select(`
        id,
        knowledge_code,
        card_type_code,
        knowledge!inner (
          code,
          name,
          description,
          metadata,
          pos,
          level,
          self_examine_prompt,
          theme
        ),
        ease_factor,
        interval_days,
        repetitions,
        next_review_date,
        last_reviewed_at
      `);

    if (error) {
      handleRepositoryError(error, 'Fetch due cards');
    }

    if (!data) {
      return [];
    }

    if (!Array.isArray(data)) {
      throw new Error('Expected array from get_due_cards_by_profile RPC');
    }

    const cards: Card[] = data.map((row: unknown, index: number) => {
      const parsed = CardRowSchema.safeParse(row);
      if (parsed.success === false) {
        const details = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        throw new Error(`Invalid card data at index ${index}: ${details}`);
      }
      return parsed.data as Card;
    });

    return cards;
  }

  async getCardById(cardId: number, profileId: string): Promise<Card | null> {
    const { data, error } = await this.client
      .from('account_cards')
      .select(`
        id,
        knowledge_code,
        ease_factor,
        interval_days,
        repetitions,
        next_review_date,
        last_reviewed_at,
        knowledge (
          code,
          name,
          description,
          metadata,
          pos,
          level,
          self_examine_prompt,
          theme
        )
      `)
      .eq('id', cardId)
      .eq('profile_id', profileId)
      .single();

    if (error || !data) {
      return null;
    }

    const parsed = CardRowSchema.safeParse(data);
    if (parsed.success === false) {
      const details = parsed.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Invalid card data from database: ${details}`);
    }
    return parsed.data as Card;
  }

  async reviewCard(params: ReviewCardParams): Promise<void> {
    const { error } = await this.client.rpc('review_card_by_profile', {
      p_card_id: params.cardId,
      p_profile_id: params.profileId,
      p_quality: params.quality,
      p_ease_factor: params.easeFactor,
      p_interval_days: params.intervalDays,
      p_repetitions: params.repetitions,
      p_next_review_date: params.nextReviewDate,
    });

    if (error) {
      handleRepositoryError(error, 'Review card');
    }
  }
}
