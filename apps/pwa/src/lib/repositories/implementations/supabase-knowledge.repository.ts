import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeRepository, PaginationParams, PaginatedResult } from '../knowledge.repository';
import { KnowledgeItem } from '@/lib/services/knowledgeService';
import { DEFAULT_KNOWLEDGE_LIMIT } from '@/lib/constants';
import { handleRepositoryError } from '../utils/error-handling';

interface KnowledgeRowDb {
  code: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  needs_correction?: boolean | null;
  pos?: string | null;
  level?: string | null;
  self_examine_prompt?: string | null;
  theme?: string | null;
}

function mapKnowledgeRow(row: KnowledgeRowDb): KnowledgeItem {
  const item: KnowledgeItem = {
    code: row.code,
    name: row.name,
    description: row.description,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    created_at: row.created_at,
    updated_at: row.updated_at,
    pos: row.pos ?? '',
    level: row.level ?? '',
    selfExaminePrompt: row.self_examine_prompt ?? '',
    theme: row.theme ?? '',
  };
  if (typeof row.needs_correction === 'boolean') {
    item.needs_correction = row.needs_correction;
  }
  return item;
}

export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  constructor(private client: SupabaseClient) {}

  async getAll(): Promise<KnowledgeItem[]> {
    const { data, error } = await this.client
      .from('knowledge')
      .select(
        'code, name, description, metadata, created_at, updated_at, pos, level, self_examine_prompt, theme'
      )
      .order('created_at', { ascending: false })
      .limit(DEFAULT_KNOWLEDGE_LIMIT);

    if (error) {
      handleRepositoryError(error, 'Fetch knowledge');
    }

    return (data ?? []).map((row) => mapKnowledgeRow(row as KnowledgeRowDb));
  }

  async getPaginated(params: PaginationParams): Promise<PaginatedResult<KnowledgeItem>> {
    const { page, pageSize, search, level, restrictToCodes, needsCorrectionOnly } = params;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Build base query for count
    let countQuery = this.client
      .from('knowledge')
      .select('*', { count: 'exact', head: true });

    if (restrictToCodes && restrictToCodes.length > 0) {
      countQuery = countQuery.in('code', restrictToCodes);
    }

    if (needsCorrectionOnly) {
      countQuery = countQuery.eq('needs_correction', true);
    }

    if (search) {
      countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (level) {
      countQuery = countQuery.eq('level', level);
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
      .select(
        'code, name, description, metadata, created_at, updated_at, needs_correction, pos, level, self_examine_prompt, theme'
      )
      .order('created_at', { ascending: false });

    if (restrictToCodes && restrictToCodes.length > 0) {
      dataQuery = dataQuery.in('code', restrictToCodes);
    }

    if (needsCorrectionOnly) {
      dataQuery = dataQuery.eq('needs_correction', true);
    }

    if (search) {
      dataQuery = dataQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (level) {
      dataQuery = dataQuery.eq('level', level);
    }

    const { data, error } = await dataQuery.range(from, to);

    if (error) {
      handleRepositoryError(error, 'Fetch paginated knowledge');
    }

    return {
      data: (data ?? []).map((row) => mapKnowledgeRow(row as KnowledgeRowDb)),
      total,
      page,
      pageSize,
      totalPages,
    };
  }
}
