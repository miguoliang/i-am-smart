/**
 * Shared API constants for both Next.js web app and WeChat miniprogram
 */

// API base URL - will be set from environment or default
export const getApiBaseUrl = (): string => {
  // For Next.js, use environment variable
  // Note: process is available in Node.js/Next.js but not in miniprogram runtime
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - process is not available in miniprogram runtime, but typeof check makes it safe
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_APP_ORIGIN) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - process.env is not available in miniprogram runtime, but typeof check makes it safe
    return process.env.NEXT_PUBLIC_APP_ORIGIN;
  }
  // For miniprogram runtime, this will be set via app config in app.ts
  // Default fallback (should be overridden in app.ts)
  return 'https://your-domain.com';
};

export const API_ENDPOINTS = {
  // Auth
  MINIPROGRAM_LOGIN: '/api/auth/miniprogram/login',
  
  // Cards
  CARDS_DUE: '/api/cards/due',
  CARD_GET: (id: number) => `/api/cards/${id}`,
  CARD_REVIEW: (id: number) => `/api/cards/${id}/review`,
  
  // Account
  ACCOUNTS_ME: '/api/accounts/me',

  // Profiles
  PROFILES: '/api/profiles',
  PROFILE: (id: string) => `/api/profiles/${id}`,

  // Stats
  STATS: '/api/stats',
  
  // Feedback
  FEEDBACK: '/api/feedback',
} as const;
