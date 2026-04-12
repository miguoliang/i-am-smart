import { NextResponse } from 'next/server';
import { ApiError, ApiErrorCode } from './apiErrorClasses';
import { logger } from './logger';

export { ApiError, ApiErrorCode };

/** Safe, user-facing copy for unexpected failures — never echo raw Error.message or DB text. */
export const PUBLIC_INTERNAL_ERROR_MESSAGE = '服务暂时不可用，请稍后重试';

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

  // Handle Supabase errors or other unknown errors — do not expose raw messages to clients
  const rawMessage = error instanceof Error ? error.message : 'Unknown error occurred';

  if (
    rawMessage.toLowerCase().includes('permission denied') ||
    rawMessage.toLowerCase().includes('access denied')
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
        message: PUBLIC_INTERNAL_ERROR_MESSAGE,
      },
    },
    { status: 500 }
  );
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<T>>({ data }, { status });
}