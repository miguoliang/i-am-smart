import { NextRequest } from 'next/server';
import { createProfileService } from '@/lib/services/factory';
import { handleApiError, apiSuccess } from '@/lib/utils/apiError';
import { requireAuth } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);
    const profileService = await createProfileService(supabase);
    const profiles = await profileService.getProfiles(user.id);
    return apiSuccess(profiles);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, supabase } = await requireAuth(req);

    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name : '';

    const { data: account } = await supabase
      .from('accounts')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = account?.plan ?? 'free';

    const profileService = await createProfileService(supabase);
    const profile = await profileService.createProfile(user.id, name, plan);

    return apiSuccess(profile);
  } catch (error) {
    return handleApiError(error);
  }
}
