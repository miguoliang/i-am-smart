/**
 * Shared API constants for the app
 */

// API base URL - will be set from environment or default
export const getApiBaseUrl = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_APP_ORIGIN) {
    return process.env.NEXT_PUBLIC_APP_ORIGIN;
  }
  return 'https://your-domain.com';
};

export const API_ENDPOINTS = {
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
