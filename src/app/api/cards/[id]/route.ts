import { NextRequest } from 'next/server';
import { createCardService } from '@/lib/services/factory';
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError';
import { requireAuth } from '@/lib/middleware/auth';
import { t } from '@/lib/i18n';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await requireAuth(req);
    const { id } = await params;

    const cardId = parseInt(id, 10);
    if (isNaN(cardId)) {
      throw ApiError.validationError(t().validation.invalidCardId);
    }

    const cardService = await createCardService(req);
    const card = await cardService.getCardById(cardId, user.id);

    if (!card) {
      throw ApiError.notFound(t().cards.cardNotFound);
    }

    return apiSuccess(card);
  } catch (error) {
    return handleApiError(error);
  }
}
