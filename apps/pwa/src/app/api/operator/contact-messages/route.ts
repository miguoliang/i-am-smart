import { NextRequest } from 'next/server';
import { apiSuccess, handleApiError } from '@/lib/utils/apiError';
import { createContactMessageService } from '@/lib/services/factory';
import { requireOperator } from '@/lib/middleware/auth';

export async function GET(req: NextRequest) {
  try {
    const { supabase } = await requireOperator(req);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const service = await createContactMessageService(supabase);
    const result = await service.getMessages(page, limit);

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
