/**
 * Default miniprogram config for local type-check/bootstrap.
 *
 * CI and release builds can overwrite this file via:
 *   npm run build:miniprogram-config
 */
export const CONFIG = {
  API_BASE_URL: 'https://your-domain.com',
  APP_ID: 'wx0000000000000000',
} as const;
