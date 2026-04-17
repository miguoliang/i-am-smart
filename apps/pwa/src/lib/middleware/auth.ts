import { createRouteHandlerClient } from '@/lib/supabaseServer';
import { ApiError } from '@/lib/utils/apiError';
import { t } from '@/lib/i18n';
import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Require authentication for API routes
 * Throws ApiError.unauthorized if user is not authenticated
 * Supports both cookie-based auth (web) and Authorization header (non-browser clients)
 * @param req Optional NextRequest to read Authorization header from
 * @returns AuthContext with authenticated user and supabase client
 */
export async function requireAuth(req?: NextRequest): Promise<AuthContext> {
  const supabase = await createRouteHandlerClient(req);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw ApiError.unauthorized(t().auth.unauthorized);
  }

  return { user, supabase };
}

/**
 * Require operator role for API routes
 * Throws ApiError.forbidden if user is not an operator
 * @param req Optional NextRequest to read Authorization header from
 * @returns AuthContext with authenticated operator user and supabase client
 */
export async function requireOperator(req?: NextRequest): Promise<AuthContext> {
  const { user, supabase } = await requireAuth(req);

  if (user.app_metadata?.role !== 'operator') {
    throw ApiError.forbidden(t().auth.forbidden);
  }

  return { user, supabase };
}
