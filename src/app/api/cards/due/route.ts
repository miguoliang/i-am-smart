// src/app/api/cards/due/route.ts
import { createCardService } from '@/lib/services/factory'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { requireAuth } from '@/lib/middleware/auth'
import { t } from '@/lib/i18n'
import { DAILY_REVIEW_LIMIT } from '@/lib/constants'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth();

    const { data: account } = await supabase
      .from('accounts')
      .select('daily_due_limit')
      .eq('id', user.id)
      .single();

    const dailyLimit = account?.daily_due_limit ?? DAILY_REVIEW_LIMIT;

    const searchParams = req.nextUrl.searchParams;
    const level = searchParams.get('level') || undefined;
    const timezoneOffset = searchParams.get('timezoneOffset')
      ? parseInt(searchParams.get('timezoneOffset')!, 10)
      : undefined;

    if (level && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      throw ApiError.validationError(t().validation.invalidLevel);
    }

    const cardService = await createCardService();
    const result = await cardService.getDueCards(user.id, level, timezoneOffset, dailyLimit);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}