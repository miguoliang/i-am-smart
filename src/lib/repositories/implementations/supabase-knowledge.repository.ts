import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeRepository, PaginationParams, PaginatedResult } from '../knowledge.repository';
import { KnowledgeItem, ImportKnowledgeParams } from '@/lib/services/knowledgeService';

export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<KnowledgeItem[]> {
    const { data, error } = await this.client
      .from('knowledge')
      .select('code, name, description, metadata, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(1000); // Keep limit for backward compatibility

    if (error) {
      throw new Error(`Fetch knowledge error: ${error.message}`);
    }

    return data as KnowledgeItem[];
  }

  async getPaginated(params: PaginationParams): Promise<PaginatedResult<KnowledgeItem>> {
    const { page, pageSize } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get total count
    const { count, error: countError } = await this.client
      .from('knowledge')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error(`Fetch knowledge count error: ${countError.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Get paginated data
    const { data, error } = await this.client
      .from('knowledge')
      .select('code, name, description, metadata, created_at, updated_at')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Fetch knowledge error: ${error.message}`);
    }

    return {
      data: (data as KnowledgeItem[]) || [],
      total,
      page,
      pageSize,
      totalPages,
    };
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
