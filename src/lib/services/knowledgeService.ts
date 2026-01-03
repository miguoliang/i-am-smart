import { KnowledgeRepository } from '@/lib/repositories/knowledge.repository';
import { logger } from '@/lib/utils/logger';

export interface KnowledgeItem {
  code: string;
  name: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ImportKnowledgeParams {
  name: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface ImportKnowledgeResult {
  success: boolean;
  count: number;
  total: number;
  skipped: number;
  message: string;
}

export class KnowledgeService {
  constructor(private knowledgeRepository: KnowledgeRepository) {}

  /**
   * Fetch all knowledge items ordered by creation date (newest first)
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
   * Batch import/upsert knowledge items
   */
  async importKnowledge(items: ImportKnowledgeParams[]): Promise<ImportKnowledgeResult> {
    // Validate and transform
    const validItems = items
      .map((item) => {
        if (!item || typeof item !== 'object' || !item.name) return null;
        
        return {
          name: item.name.trim(),
          description: item.description?.trim() || "",
          metadata: item.metadata || {},
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null && item.name.length > 0);

    if (validItems.length === 0) {
      return {
        success: false,
        count: 0,
        total: 0,
        skipped: 0,
        message: "No valid items found",
      };
    }

    // Upsert via repository
    const { count, skipped } = await this.knowledgeRepository.import(validItems);

    return {
      success: true,
      count,
      total: validItems.length,
      skipped,
      message: `Successfully imported ${count} items. ${skipped} duplicates skipped.`,
    };
  }
}
