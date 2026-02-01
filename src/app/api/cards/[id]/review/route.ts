import { NextRequest } from 'next/server'
import { createCardService } from '@/lib/services/factory'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { requireAuth } from '@/lib/middleware/auth'
import { MAX_QUALITY, MIN_QUALITY, DAILY_REVIEW_LIMIT } from '@/lib/constants'
import { t, translate } from '@/lib/i18n'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { quality, timezoneOffset } = await request.json();

    if (typeof quality !== 'number' || quality < MIN_QUALITY || quality > MAX_QUALITY) {
      throw ApiError.validationError(
        translate(t().validation.qualityMustBeBetween, { min: MIN_QUALITY, max: MAX_QUALITY })
      );
    }

    const { user, supabase } = await requireAuth();
    const { id } = await params;

    const { data: account } = await supabase
      .from('accounts')
      .select('daily_due_limit')
      .eq('id', user.id)
      .single();

    const dailyLimit = account?.daily_due_limit ?? DAILY_REVIEW_LIMIT;

    const cardId = parseInt(id, 10);
    if (isNaN(cardId)) {
      throw ApiError.validationError(t().validation.invalidCardId);
    }

    const cardService = await createCardService();
    const result = await cardService.reviewCard(user.id, cardId, quality, timezoneOffset, dailyLimit);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}