import { NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from './apiErrorClasses';
import { logger } from './logger';

export { ApiError, ApiErrorCode };

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    data?: unknown;
  };
}

/**
 * Parses an API error response body and returns a user-facing message.
 * Use when handling non-ok fetch responses to surface server error messages.
 *
 * @param response - The fetch Response (non-ok)
 * @param defaultMessage - Fallback message if body is not JSON or has no error.message
 * @returns Promise resolving to the error message to throw
 */
export async function parseApiErrorResponse(
  response: Response,
  defaultMessage: string
): Promise<string> {
  try {
    const body = (await response.json()) as ApiResponse | null;
    const message = body?.error?.message;
    if (typeof message === "string" && message.length > 0) {
      return message;
    }
  } catch {
    // Response body was not JSON or was empty
  }
  return defaultMessage;
}

export function handleApiError(error: unknown) {
  logger.error('API Error', { error });

  if (error instanceof ApiError) {
    return NextResponse.json<ApiResponse>(
      {
        error: {
          code: error.code,
          message: error.message,
          data: error.data,
        },
      },
      { status: error.statusCode }
    );
  }

  // Handle Supabase errors or other unknown errors
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  
  // Try to map known Supabase errors to proper status codes
  if (
    message.toLowerCase().includes('permission denied') ||
    message.toLowerCase().includes('access denied')
  ) {
    return NextResponse.json<ApiResponse>(
      { error: { code: ApiErrorCode.FORBIDDEN, message: 'Permission denied' } },
      { status: 403 }
    );
  }

  return NextResponse.json<ApiResponse>(
    {
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: message,
      },
    },
    { status: 500 }
  );
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status });
}