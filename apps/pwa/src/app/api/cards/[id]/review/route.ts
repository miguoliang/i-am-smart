import { NextRequest } from 'next/server'
import { createCardService, createProfileService } from '@/lib/services/factory'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'
import { requireAuth } from '@/lib/middleware/auth'
import { MAX_QUALITY, MIN_QUALITY } from '@/lib/constants'
import { t, translate } from '@/lib/i18n'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { quality, timezoneOffset, profileId: requestProfileId } = await request.json();

    if (typeof quality !== 'number' || quality < MIN_QUALITY || quality > MAX_QUALITY) {
      throw ApiError.validationError(
        translate(t().validation.qualityMustBeBetween, { min: MIN_QUALITY, max: MAX_QUALITY })
      );
    }

    const { user, supabase } = await requireAuth(request);
    const { id } = await params;

    const cardId = parseInt(id, 10);
    if (isNaN(cardId)) {
      throw ApiError.validationError(t().validation.invalidCardId);
    }

    // Resolve profile
    const profileService = await createProfileService(supabase);
    let resolvedProfileId: string;
    if (requestProfileId) {
      const profiles = await profileService.getProfiles(user.id);
      const match = profiles.find((p) => p.id === requestProfileId);
      if (!match) {
        throw ApiError.notFound('学习档案不存在');
      }
      resolvedProfileId = match.id;
    } else {
      const defaultProfile = await profileService.getDefaultProfile(user.id);
      resolvedProfileId = defaultProfile.id;
    }

    const cardService = await createCardService(supabase);
    const result = await cardService.reviewCard(resolvedProfileId, cardId, quality, timezoneOffset);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
