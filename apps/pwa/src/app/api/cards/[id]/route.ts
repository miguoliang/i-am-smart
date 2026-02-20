import { NextRequest } from 'next/server';
import { createCardService, createProfileService } from '@/lib/services/factory';
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError';
import { requireAuth } from '@/lib/middleware/auth';
import { t } from '@/lib/i18n';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(req);
    const { id } = await params;

    const cardId = parseInt(id, 10);
    if (isNaN(cardId)) {
      throw ApiError.validationError(t().validation.invalidCardId);
    }

    const profileId = req.nextUrl.searchParams.get('profileId') || undefined;
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
    const card = await cardService.getCardById(cardId, resolvedProfileId);

    if (!card) {
      throw ApiError.notFound(t().cards.cardNotFound);
    }

    return apiSuccess(card);
  } catch (error) {
    return handleApiError(error);
  }
}
