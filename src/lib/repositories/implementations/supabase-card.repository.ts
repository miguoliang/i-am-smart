import { SupabaseClient } from '@supabase/supabase-js';
import { CardRepository, ReviewCardParams } from '../card.repository';
import { Card, KnowledgeMetadata } from '@/app/learn/types';

interface RawCardData {
  id: number;
  knowledge_code: string;
  card_type_code: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_reviewed_at: string | null;
  knowledge: {
    code: string;
    name: string;
    description: string;
    metadata: KnowledgeMetadata;
  };
}

export class SupabaseCardRepository implements CardRepository {
  constructor(private client: SupabaseClient) {}

  async getReviewedTodayCount(userId: string, startDate: string, endDate: string): Promise<number> {
    const { count, error } = await this.client
      .from('account_cards')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', userId)
      .gte('last_reviewed_at', startDate)
      .lte('last_reviewed_at', endDate);

    if (error) {
      throw new Error(`Count reviewed today error: ${error.message}`);
    }

    return count ?? 0;
  }

  async getDueCards(userId: string, limit: number, level?: string): Promise<Card[]> {
    const { data, error } = await this.client
      .rpc('get_due_cards', {
        p_user_id: userId,
        p_limit: limit * (level ? 2 : 1), // Fetch more if filtering by level to ensure we have enough after filtering
      })
      .select(`
        id,
        knowledge_code,
        card_type_code,
        knowledge!inner (
          code,
          name,
          description,
          metadata
        ),
        ease_factor,
        interval_days,
        repetitions,
        next_review_date,
        last_reviewed_at
      `);

    if (error) {
      throw new Error(`Fetch due cards error: ${error.message}`);
    }

    let cards = (data as unknown as RawCardData[]).map((card) => ({
      ...card,
    }));

    // Filter by level if specified
    if (level) {
      cards = cards.filter((card) => {
        const cardLevel = card.knowledge?.metadata?.level;
        return cardLevel === level;
      });
    }

    // Limit to requested amount after filtering
    return cards.slice(0, limit);
  }

  async getCardById(cardId: number, userId: string): Promise<Card | null> {
    const { data, error } = await this.client
      .from('account_cards')
      .select('*')
      .eq('id', cardId)
      .eq('account_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Note: This returns the raw DB shape, but the Card interface is used in the app.
    // The current service code also fetches 'account_cards' and casts it.
    // However, 'account_cards' table structure might not perfectly match 'Card' interface 
    // which includes 'knowledge' object if we don't join. 
    // The 'reviewCard' method in service fetches specific card without joining knowledge.
    // The 'getDueCards' fetches WITH knowledge.
    // For `getCardById`, the service mainly used it to check existence and review data.
    return data as unknown as Card;
  }

  async reviewCard(params: ReviewCardParams): Promise<void> {
    const { error } = await this.client.rpc('review_card', {
      p_card_id: params.cardId,
      p_user_id: params.userId,
      p_quality: params.quality,
      p_ease_factor: params.easeFactor,
      p_interval_days: params.intervalDays,
      p_repetitions: params.repetitions,
      p_next_review_date: params.nextReviewDate,
    });

    if (error) {
      throw new Error(`Review card failed: ${error.message}`);
    }
  }
}
