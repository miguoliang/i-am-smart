import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { NextRequest } from 'next/server';
import { createAccountService } from '@/lib/services/factory';
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createRouteHandlerClient();
    const { id } = await params;

    // Check operator permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.app_metadata?.role !== "operator") {
      throw ApiError.forbidden("权限不足");
    }

    // Account ID is a UUID (from Supabase Auth)
    const accountId = id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(accountId)) {
      throw ApiError.validationError("无效的账户ID格式");
    }

    const accountService = createAccountService();
    const result = await accountService.distributeCards(accountId);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
