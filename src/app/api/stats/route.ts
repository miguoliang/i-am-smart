import { NextRequest, NextResponse } from 'next/server';
import { createStatsService } from '@/lib/services/factory';
import { handleApiError, ApiError } from '@/lib/utils/apiError';
import { requireAuth } from '@/lib/middleware/auth';
import { t } from '@/lib/i18n';

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const timezoneOffset = Number(searchParams.get('offset') || '0');

    if (isNaN(timezoneOffset)) {
      throw ApiError.validationError(t().validation.invalidTimezoneOffset);
    }

    const statsService = await createStatsService(request);
    const data = await statsService.getStats(user.id, timezoneOffset);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
