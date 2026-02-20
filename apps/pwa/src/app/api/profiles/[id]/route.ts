import { NextRequest } from 'next/server';
import { createProfileService } from '@/lib/services/factory';
import { handleApiError, apiSuccess } from '@/lib/utils/apiError';
import { requireAuth } from '@/lib/middleware/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(req);
    const { id } = await params;

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name : '';

    const profileService = await createProfileService(supabase);
    const profile = await profileService.updateProfile(id, user.id, name);

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(req);
    const { id } = await params;

    const profileService = await createProfileService(supabase);
    await profileService.deleteProfile(id, user.id);

    return apiSuccess({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
