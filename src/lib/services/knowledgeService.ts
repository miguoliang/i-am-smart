import { SupabaseClient } from '@supabase/supabase-js';
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

export const knowledgeService = {
  /**
   * Fetch all knowledge items ordered by creation date (newest first)
   */
  async getAllKnowledge(supabase: SupabaseClient): Promise<KnowledgeItem[]> {
    logger.debug('Fetching all knowledge items');
    
    const { data, error } = await supabase
      .from('knowledge')
      .select('code, name, description, metadata, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Failed to fetch knowledge items', {
        error,
        errorMessage: error.message,
        errorCode: error.code,
        errorDetails: error.details,
      });
      throw new Error(`Fetch knowledge error: ${error.message}`);
    }

    logger.debug('Successfully fetched knowledge items', {
      count: data?.length || 0,
    });

    return data as KnowledgeItem[];
  },

  /**
   * Batch import/upsert knowledge items
   */
  async importKnowledge(
    supabase: SupabaseClient, 
    items: ImportKnowledgeParams[]
  ): Promise<ImportKnowledgeResult> {
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

    // Upsert
    const { data: inserted, error } = await supabase
      .from("knowledge")
      .upsert(validItems, {
        onConflict: "name",
        ignoreDuplicates: true,
      })
      .select("code");

    if (error) {
      throw new Error(`Import error: ${error.message}`);
    }

    const insertedCount = inserted?.length || 0;
    const skippedCount = validItems.length - insertedCount;

    return {
      success: true,
      count: insertedCount,
      total: validItems.length,
      skipped: skippedCount,
      message: `Successfully imported ${insertedCount} items. ${skippedCount} duplicates skipped.`,
    };
  }
};
