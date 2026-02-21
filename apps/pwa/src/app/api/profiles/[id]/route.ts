import { NextRequest } from 'next/server';
import { createProfileService } from '@/lib/services/factory';
import { handleApiError, apiSuccess } from '@/lib/utils/apiError';
import { requireAuth } from '@/lib/middleware/auth';
import type { Level } from '@i-am-smart/shared/constants';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, supabase } = await requireAuth(req);
    const { id } = await params;

    const body = await req.json();
    const updates: { name?: string; level?: Level } = {};

    if (typeof body.name === 'string') {
      updates.name = body.name;
    }
    if (typeof body.level === 'string') {
      updates.level = body.level as Level;
    }

    const profileService = await createProfileService(supabase);
    const profile = await profileService.updateProfile(id, user.id, updates);

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT delegates to PATCH (WeChat miniprogram doesn't support PATCH)
export const PUT = PATCH;

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
