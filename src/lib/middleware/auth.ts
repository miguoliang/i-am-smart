import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { ApiError } from '@/lib/utils/apiError';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Require authentication for API routes
 * Throws ApiError.unauthorized if user is not authenticated
 * @returns AuthContext with authenticated user and supabase client
 */
export async function requireAuth(): Promise<AuthContext> {
  const supabase = await createRouteHandlerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw ApiError.unauthorized('未登录');
  }

  return { user, supabase };
}

/**
 * Require operator role for API routes
 * Throws ApiError.forbidden if user is not an operator
 * @returns AuthContext with authenticated operator user and supabase client
 */
export async function requireOperator(): Promise<AuthContext> {
  const { user, supabase } = await requireAuth();

  if (user.app_metadata?.role !== 'operator') {
    throw ApiError.forbidden('权限不足');
  }

  return { user, supabase };
}
