import { NextRequest } from 'next/server'
import { createCardService } from '@/lib/services/factory'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { requireAuth } from '@/lib/middleware/auth'
import { MAX_QUALITY, MIN_QUALITY } from '@/lib/constants'
import { t, translate } from '@/lib/i18n'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { quality } = await request.json() // 0-5
    
    // Validate quality parameter
    if (typeof quality !== 'number' || quality < MIN_QUALITY || quality > MAX_QUALITY) {
      throw ApiError.validationError(
        translate(t().validation.qualityMustBeBetween, { min: MIN_QUALITY, max: MAX_QUALITY })
      );
    }

    const { user } = await requireAuth();
    const { id } = await params

    const cardId = parseInt(id, 10)
    if (isNaN(cardId)) {
      throw ApiError.validationError(t().validation.invalidCardId);
    }

    const cardService = await createCardService()
    const result = await cardService.reviewCard(user.id, cardId, quality)

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}