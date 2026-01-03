// src/app/api/cards/due/route.ts
import { createRouteHandlerClient } from '@/lib/supabaseServer'
import { createCardService } from '@/lib/services/factory'
import { ApiError, handleApiError, apiSuccess } from '@/lib/utils/apiError'

export async function GET() {
  try {
    const supabase = await createRouteHandlerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      throw ApiError.unauthorized('未登录')
    }

    const cardService = await createCardService();
    const result = await cardService.getDueCards(user.id)

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}