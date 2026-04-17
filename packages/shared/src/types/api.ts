/**
 * Shared API response types
 */

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    code: string;
    message: string;
    data?: unknown;
  };
}

export interface ApiError {
  code: string;
  message: string;
  data?: unknown;
}
