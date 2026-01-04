// src/app/api/knowledge/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest } from 'next/server'
import { createKnowledgeService } from '@/lib/services/factory'
import { ImportKnowledgeParams } from '@/lib/services/knowledgeService'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { logger } from '@/lib/utils/logger'

interface CefrKnowledgeItem {
  englishWord: string;
  pos: string;
  level: string;
  chineseTranslation: string;
  exampleSentence: string;
  selfExaminePrompt: string;
  theme: string;
  imageName: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      logger.error('Knowledge GET: Authentication failed', { authError });
      throw ApiError.unauthorized('未登录')
    }

    // Check if user is operator
    const role = user.app_metadata?.role;
    
    logger.debug('Knowledge GET: Operator check', {
      userId: user.id,
      role,
    });

    if (role !== 'operator') {
      logger.warn('Knowledge GET: Access denied - not an operator', {
        userId: user.id,
        role,
      });
      throw ApiError.forbidden('权限不足')
    }

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

    // Validate pagination parameters
    if (page < 1) {
      throw ApiError.validationError('Page must be greater than 0');
    }
    if (pageSize < 1 || pageSize > 100) {
      throw ApiError.validationError('Page size must be between 1 and 100');
    }

    const knowledgeService = await createKnowledgeService()
    const result = await knowledgeService.getPaginatedKnowledge({ page, pageSize })
    
    logger.debug('Knowledge GET: Success', {
      userId: user.id,
      page,
      pageSize,
      total: result.total,
      totalPages: result.totalPages,
      count: result.data?.length || 0,
    });

    return apiSuccess(result)
  } catch (error) {
    logger.error('Knowledge GET: Error', { error });
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check Content-Type header
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw ApiError.validationError("Content-Type must be application/json");
    }

    let cefrItems: CefrKnowledgeItem[] = [];
    
    try {
      const body = await req.json();
      
      // Validate body is an array
      if (!Array.isArray(body)) {
        throw ApiError.validationError("Request body must be a JSON array matching the CEFR format");
      }

      // Validate array structure matches CEFR format
      if (body.length === 0) {
        throw ApiError.validationError("No items to import");
      }

      // Validate each item has required fields
      for (const item of body) {
        if (!item || typeof item !== 'object') {
          throw ApiError.validationError("Each item must be an object");
        }
        if (!item.englishWord || typeof item.englishWord !== 'string') {
          throw ApiError.validationError("Each item must have an 'englishWord' field (string)");
        }
      }

      cefrItems = body as CefrKnowledgeItem[];
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw ApiError.validationError("Invalid JSON format");
    }

    // Transform CEFR format to ImportKnowledgeParams
    const items: ImportKnowledgeParams[] = cefrItems.map((item) => ({
      name: item.englishWord.trim(),
      description: item.chineseTranslation?.trim() || "",
      metadata: {
        pos: item.pos,
        level: item.level,
        exampleSentence: item.exampleSentence,
        selfExaminePrompt: item.selfExaminePrompt,
        theme: item.theme,
        imageName: item.imageName,
      },
    }));

    const supabase = await createRouteHandlerClient();

    // Check permissions
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.error('Knowledge POST: Authentication failed', { authError });
      throw ApiError.forbidden("Permission denied");
    }

    // Check if user is operator
    const role = user.app_metadata?.role;
    
    logger.debug('Knowledge POST: Operator check', {
      userId: user.id,
      role,
    });

    if (role !== "operator") {
      logger.warn('Knowledge POST: Access denied - not an operator', {
        userId: user.id,
        role,
      });
      throw ApiError.forbidden("Permission denied");
    }

    const knowledgeService = await createKnowledgeService()
    const result = await knowledgeService.importKnowledge(items);
    
    if (!result.success && result.message === "No valid items found") {
        throw ApiError.validationError(result.message);
    }

    return apiSuccess(result);

  } catch (e) {
    return handleApiError(e);
  }
}