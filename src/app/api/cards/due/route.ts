// src/app/api/cards/due/route.ts
import { createCardService } from '@/lib/services/factory'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { requireAuth } from '@/lib/middleware/auth'
import { t } from '@/lib/i18n'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { user } = await requireAuth();

    // Parse optional level query parameter
    const searchParams = req.nextUrl.searchParams;
    const level = searchParams.get('level') || undefined;

    // Validate level if provided
    if (level && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      throw ApiError.validationError(t().validation.invalidLevel);
    }

    const cardService = await createCardService();
    const result = await cardService.getDueCards(user.id, level)

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}