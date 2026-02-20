/**
 * Internationalization utilities
 * 
 * Simple i18n system that can be easily replaced with a full i18n library
 * (e.g., next-intl, react-i18next) in the future
 */

import { getTranslations, translate, type Locale, type Translations } from "./translations";

// Default locale
const DEFAULT_LOCALE: Locale = "zh-CN";

// Get current locale (can be extended to read from user preferences, cookies, etc.)
export function getLocale(): Locale {
  // TODO: Read from user preferences, cookies, or browser settings
  return DEFAULT_LOCALE;
}

// Get translations for current locale
export function t(): Translations {
  return getTranslations(getLocale());
}

// Export translation function
export { translate };

// Export types
export type { Locale, Translations };
