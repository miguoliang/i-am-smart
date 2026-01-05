import { NextResponse } from 'next/server';
import { createStatsService } from '@/lib/services/factory';
import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { handleApiError, ApiError } from '@/lib/utils/apiError';

export async function GET(request: Request) {
  try {
    const supabase = await createRouteHandlerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw ApiError.unauthorized('未登录');
    }

    const { searchParams } = new URL(request.url);
    const timezoneOffset = Number(searchParams.get('offset') || '0');

    if (isNaN(timezoneOffset)) {
      throw ApiError.validationError('Invalid timezone offset');
    }

    const statsService = await createStatsService();
    const data = await statsService.getStats(user.id, timezoneOffset);

    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}
