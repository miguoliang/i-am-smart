import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeRepository, PaginationParams, PaginatedResult } from '../knowledge.repository';
import { KnowledgeItem } from '@/lib/services/knowledgeService';
import { DEFAULT_KNOWLEDGE_LIMIT } from '@/lib/constants';
import { handleRepositoryError } from '../utils/error-handling';

export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<KnowledgeItem[]> {
    const { data, error } = await this.client
      .from('knowledge')
      .select('code, name, description, metadata, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(DEFAULT_KNOWLEDGE_LIMIT);

    if (error) {
      handleRepositoryError(error, 'Fetch knowledge');
    }

    return (data as KnowledgeItem[]) || [];
  }

  async getPaginated(params: PaginationParams): Promise<PaginatedResult<KnowledgeItem>> {
    const { page, pageSize, search, level, restrictToCodes } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base query for count
    let countQuery = this.client
      .from('knowledge')
      .select('*', { count: 'exact', head: true });

    if (restrictToCodes && restrictToCodes.length > 0) {
      countQuery = countQuery.in('code', restrictToCodes);
    }

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (level) {
      countQuery = countQuery.eq('metadata->>level', level);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      handleRepositoryError(countError, 'Fetch knowledge count');
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Build data query
    let dataQuery = this.client
      .from('knowledge')
      .select('code, name, description, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (restrictToCodes && restrictToCodes.length > 0) {
      dataQuery = dataQuery.in('code', restrictToCodes);
    }

    if (search) {
      dataQuery = dataQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (level) {
      dataQuery = dataQuery.eq('metadata->>level', level);
    }

    const { data, error } = await dataQuery.range(from, to);

    if (error) {
      handleRepositoryError(error, 'Fetch paginated knowledge');
    }

    return {
      data: (data as KnowledgeItem[]) || [],
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
