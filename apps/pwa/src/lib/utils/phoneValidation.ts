/**
 * Phone number validation utility
 * Provides reusable phone number validation functions for Chinese mobile numbers
 */

const CHINA_PHONE_REGEX = /^1[3-9]\d{9}$/;

/**
 * Sanitizes and normalizes a phone number
 * - Trims whitespace
 * - Removes spaces, dashes, and parentheses
 * - Strips leading +86 or 86 country code
 * @param phone - The phone number to sanitize
 * @returns Sanitized phone number (digits only, without country code)
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== "string") {
    return "";
  }
  let cleaned = phone.trim().replace(/[\s\-()]/g, "");
  // Strip +86 or 86 prefix
  if (cleaned.startsWith("+86")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("86") && cleaned.length === 13) {
    cleaned = cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Checks if a phone number is a valid Chinese mobile number
 * @param phone - The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") {
    return false;
  }
  const sanitized = sanitizePhone(phone);
  return CHINA_PHONE_REGEX.test(sanitized);
}

/**
 * Validates a phone number and returns structured result
 * @param phone - The phone number to validate
 * @returns Object with isValid flag and optional error message
 */
export function validatePhone(phone: string): {
  isValid: boolean;
  error?: string;
} {
  if (!phone || typeof phone !== "string") {
    return { isValid: false, error: "手机号不能为空" };
  }
  const sanitized = sanitizePhone(phone);
  if (!sanitized) {
    return { isValid: false, error: "手机号不能为空" };
  }
  if (!isValidPhone(sanitized)) {
    return { isValid: false, error: "手机号格式不正确" };
  }
  return { isValid: true };
}

/**
 * Formats a phone number for display with the +86 country code
 * @param phone - The phone number to format
 * @returns Formatted phone number with country code
 */
export function formatPhoneForSupabase(phone: string): string {
  const sanitized = sanitizePhone(phone);
  return `+86${sanitized}`;
}
