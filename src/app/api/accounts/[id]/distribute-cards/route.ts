import { NextRequest } from 'next/server';
import { createAccountService } from '@/lib/services/factory';
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError';
import { requireOperator } from '@/lib/middleware/auth';
import { t } from '@/lib/i18n';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireOperator();
    const { id } = await params;

    // Account ID is a UUID (from Supabase Auth)
    const accountId = id;
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(accountId)) {
      throw ApiError.validationError(t().validation.invalidAccountIdFormat);
    }

    const accountService = createAccountService();
    const result = await accountService.distributeCards(accountId);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
