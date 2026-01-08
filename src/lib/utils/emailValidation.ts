/**
 * Email validation utility
 * Provides reusable email validation functions
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Checks if an email address is valid
 * @param email - The email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
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
  if (!isValidEmail(email)) {
    return { isValid: false, error: '邮箱格式不正确' };
  }
  return { isValid: true };
}
