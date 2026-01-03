import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeRepository } from '../knowledge.repository';
import { KnowledgeItem, ImportKnowledgeParams } from '@/lib/services/knowledgeService';

export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<KnowledgeItem[]> {
    const { data, error } = await this.client
      .from('knowledge')
      .select('code, name, description, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Fetch knowledge error: ${error.message}`);
    }

    return data as KnowledgeItem[];
  }

  async import(items: ImportKnowledgeParams[]): Promise<{ count: number; skipped: number }> {
    const { data: inserted, error } = await this.client
      .from("knowledge")
      .upsert(items, {
        onConflict: "name",
        ignoreDuplicates: true,
      })
      .select("code");

    if (error) {
      throw new Error(`Import error: ${error.message}`);
    }

    const count = inserted?.length || 0;
    const skipped = items.length - count;

    return { count, skipped };
  }
}
