/**
 * Email validation utility
 * Provides reusable email validation functions
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sanitizes and normalizes an email address
 * - Trims whitespace
 * - Converts to lowercase
 * - Removes leading/trailing whitespace
 * @param email - The email address to sanitize
 * @returns Sanitized email address
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Checks if an email address is valid
 * @param email - The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const sanitized = sanitizeEmail(email);
  return EMAIL_REGEX.test(sanitized);
}

/**
 * Validates an email address and returns structured result
 * @param email - The email address to validate
 * @returns Object with isValid flag and optional error message
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: '邮箱不能为空' };
  }
  const sanitized = sanitizeEmail(email);
  if (!sanitized) {
    return { isValid: false, error: '邮箱不能为空' };
  }
  if (!isValidEmail(sanitized)) {
    return { isValid: false, error: '邮箱格式不正确' };
  }
  return { isValid: true };
}
