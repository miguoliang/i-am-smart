import { SupabaseClient } from '@supabase/supabase-js';
import { CardRepository, ReviewCardParams } from '../card.repository';
import { Card, KnowledgeMetadata } from '@/app/learn/types';

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

    if (!data) {
      return [];
    }

    if (!Array.isArray(data)) {
      throw new Error('Expected array from get_due_cards RPC');
    }

    // Validate and transform data properly
    const cards: Card[] = data.map((card: unknown) => {
      // Type guard to validate card structure
      if (!card || typeof card !== 'object') {
        throw new Error(`Invalid card data: not an object`);
      }

      const cardData = card as Record<string, unknown>;

      // Validate required fields
      if (!cardData.id || !cardData.knowledge_code || !cardData.next_review_date) {
        throw new Error(`Invalid card data: missing required fields`);
      }

      // Handle knowledge - Supabase returns it as an object (not array) with !inner
      const knowledgeData = cardData.knowledge;
      if (!knowledgeData || typeof knowledgeData !== 'object' || Array.isArray(knowledgeData)) {
        throw new Error(`Invalid card data: missing or invalid knowledge object`);
      }

      const knowledge = knowledgeData as Record<string, unknown>;

      return {
        id: cardData.id as number,
        knowledge_code: cardData.knowledge_code as string,
        knowledge: {
          code: knowledge.code as string,
          name: knowledge.name as string,
          description: knowledge.description as string,
          metadata: (knowledge.metadata || {}) as KnowledgeMetadata,
        },
        next_review_date: cardData.next_review_date as string,
        last_reviewed_at: (cardData.last_reviewed_at ?? undefined) as string | undefined,
        ease_factor: (cardData.ease_factor ?? undefined) as number | undefined,
        interval_days: (cardData.interval_days ?? undefined) as number | undefined,
        repetitions: (cardData.repetitions ?? undefined) as number | undefined,
      };
    });

    return cards;
  }

  async getCardById(cardId: number, userId: string): Promise<Card | null> {
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
          metadata
        )
      `)
      .eq('id', cardId)
      .eq('account_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    // Validate required fields
    if (!data.id || !data.knowledge_code || !data.next_review_date) {
      throw new Error(`Invalid card data from database: missing required fields`);
    }

    // Validate knowledge object - Supabase returns it as an object (not array) with single()
    const knowledgeData = data.knowledge;
    if (!knowledgeData || typeof knowledgeData !== 'object' || Array.isArray(knowledgeData)) {
      throw new Error(`Invalid card data: missing or invalid knowledge object`);
    }

    const knowledge = knowledgeData as Record<string, unknown>;

    return {
      id: data.id as number,
      knowledge_code: data.knowledge_code as string,
      knowledge: {
        code: knowledge.code as string,
        name: knowledge.name as string,
        description: knowledge.description as string,
        metadata: (knowledge.metadata || {}) as KnowledgeMetadata,
      },
      next_review_date: data.next_review_date as string,
      last_reviewed_at: (data.last_reviewed_at ?? undefined) as string | undefined,
      ease_factor: (data.ease_factor ?? undefined) as number | undefined,
      interval_days: (data.interval_days ?? undefined) as number | undefined,
      repetitions: (data.repetitions ?? undefined) as number | undefined,
    };
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
