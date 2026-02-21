import { createCardService, createProfileService } from '@/lib/services/factory'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { requireAuth } from '@/lib/middleware/auth'
import { t } from '@/lib/i18n'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const searchParams = req.nextUrl.searchParams;
    const level = searchParams.get('level') || undefined;
    const timezoneOffset = searchParams.get('timezoneOffset')
      ? parseInt(searchParams.get('timezoneOffset')!, 10)
      : undefined;
    const profileId = searchParams.get('profileId') || undefined;

    if (level && !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
      throw ApiError.validationError(t().validation.invalidLevel);
    }

    // Resolve profile: use provided profileId or fall back to default
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

    const cardService = await createCardService(supabase);
    const result = await cardService.getDueCards(resolvedProfileId, level, timezoneOffset);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
