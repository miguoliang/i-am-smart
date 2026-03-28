import { KnowledgeRepository, PaginatedResult } from '@/lib/repositories/knowledge.repository';
import { logger } from '@/lib/utils/logger';

export interface KnowledgeItem {
  code: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  /** When true, entry is flagged for operator correction */
  needs_correction?: boolean;
  pos: string;
  level: string;
  selfExaminePrompt: string;
  theme: string;
}

export interface KnowledgePaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  level?: string;
  restrictToCodes?: string[];
  /** Only rows flagged for correction */
  needsCorrectionOnly?: boolean;
}

export class KnowledgeService {
  constructor(private knowledgeRepository: KnowledgeRepository) {}

  /**
   * Fetch all knowledge items ordered by creation date (newest first)
   * @deprecated Use getPaginatedKnowledge instead for better performance
   */
  async getAllKnowledge(): Promise<KnowledgeItem[]> {
    logger.debug('Fetching all knowledge items');
    
    try {
      const data = await this.knowledgeRepository.getAll();
      
      logger.debug('Successfully fetched knowledge items', {
        count: data?.length || 0,
      });

      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to fetch knowledge items', {
        error,
        errorMessage,
      });
      throw error;
    }
  }

  /**
   * Fetch paginated knowledge items ordered by creation date (newest first)
   */
  async getPaginatedKnowledge(params: KnowledgePaginationParams = {}): Promise<PaginatedResult<KnowledgeItem>> {
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const search = params.search;
    const level = params.level;
    const restrictToCodes = params.restrictToCodes;
    const needsCorrectionOnly = params.needsCorrectionOnly;

    logger.debug('Fetching paginated knowledge items', {
      page,
      pageSize,
      search,
      level,
      restrictToCodesCount: restrictToCodes?.length ?? 0,
      needsCorrectionOnly: Boolean(needsCorrectionOnly),
    });
    
    try {
      const result = await this.knowledgeRepository.getPaginated({
        page,
        pageSize,
        search,
        level,
        restrictToCodes,
        needsCorrectionOnly,
      });
      
      logger.debug('Successfully fetched paginated knowledge items', {
        page,
        pageSize,
        total: result.total,
        totalPages: result.totalPages,
        count: result.data?.length || 0,
      });

      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Failed to fetch paginated knowledge items', {
        error,
        errorMessage,
        page,
        pageSize,
      });
      throw error;
    }
  }
}
