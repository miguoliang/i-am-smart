// src/app/api/knowledge/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { NextRequest } from 'next/server'
import { knowledgeService, ImportKnowledgeParams } from '@/lib/services/knowledgeService'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { logger } from '@/lib/utils/logger'

export async function GET() {
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

    const data = await knowledgeService.getAllKnowledge(supabase)
    
    logger.debug('Knowledge GET: Success', {
      userId: user.id,
      knowledgeCount: data?.length || 0,
    });

    return apiSuccess(data)
  } catch (error) {
    logger.error('Knowledge GET: Error', { error });
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    let items: ImportKnowledgeParams[] = [];
    
    try {
      const body = await req.json();
      // Handle both array input and wrapped input
      if (Array.isArray(body)) {
        items = body;
      } else if (body && Array.isArray(body.items)) {
        items = body.items;
      } else {
         throw ApiError.validationError("Invalid request format. Expected an array of items.");
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      throw ApiError.validationError("Invalid JSON");
    }

    if (items.length === 0) {
      throw ApiError.validationError("No items to import");
    }

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

    const result = await knowledgeService.importKnowledge(supabase, items);
    
    if (!result.success && result.message === "No valid items found") {
        throw ApiError.validationError(result.message);
    }

    return apiSuccess(result);

  } catch (e) {
    return handleApiError(e);
  }
}
