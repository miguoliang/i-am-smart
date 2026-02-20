import { NextRequest } from 'next/server';
import { createStatsService, createProfileService } from '@/lib/services/factory';
import { handleApiError, ApiError, apiSuccess } from '@/lib/utils/apiError';
import { requireAuth } from '@/lib/middleware/auth';
import { t } from '@/lib/i18n';

export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(request);

    const { searchParams } = new URL(request.url);
    const timezoneOffset = Number(searchParams.get('offset') || '0');
    const profileId = searchParams.get('profileId') || undefined;

    if (isNaN(timezoneOffset)) {
      throw ApiError.validationError(t().validation.invalidTimezoneOffset);
    }

    // Resolve profile
    const profileService = await createProfileService(supabase);
    let resolvedProfileId: string;
    if (profileId) {
      const profiles = await profileService.getProfiles(user.id);
      const match = profiles.find((p) => p.id === profileId);
      if (!match) {
        throw ApiError.notFound('学习档案不存在');
      }
      resolvedProfileId = match.id;
    } else {
      const defaultProfile = await profileService.getDefaultProfile(user.id);
      resolvedProfileId = defaultProfile.id;
    }

    const statsService = await createStatsService(supabase);
    const data = await statsService.getStats(resolvedProfileId, timezoneOffset);

    return apiSuccess(data);
  } catch (error) {
    return handleApiError(error);
  }
}
