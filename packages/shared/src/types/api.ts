/**
 * Shared API response types for both Next.js web app and WeChat miniprogram
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
