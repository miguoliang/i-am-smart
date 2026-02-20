import { sanitizeEmail, isValidEmail, validateEmail } from './emailValidation';

describe('emailValidation', () => {
  describe('sanitizeEmail', () => {
    it('should trim whitespace from email', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
      expect(sanitizeEmail('\ttest@example.com\n')).toBe('test@example.com');
    });

    it('should convert email to lowercase', () => {
      expect(sanitizeEmail('Test@Example.COM')).toBe('test@example.com');
      expect(sanitizeEmail('USER@DOMAIN.COM')).toBe('user@domain.com');
    });

    it('should handle empty string', () => {
      expect(sanitizeEmail('')).toBe('');
      expect(sanitizeEmail('   ')).toBe('');
    });

    it('should handle non-string input', () => {
      expect(sanitizeEmail(null as unknown as string)).toBe('');
      expect(sanitizeEmail(undefined as unknown as string)).toBe('');
      expect(sanitizeEmail(123 as unknown as string)).toBe('');
    });

    it('should preserve valid email format', () => {
      expect(sanitizeEmail('user.name+tag@example.co.uk')).toBe('user.name+tag@example.co.uk');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@example.com')).toBe(true);
      expect(isValidEmail('user+tag@example.co.uk')).toBe(true);
      expect(isValidEmail('user_name@example-domain.com')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test@example')).toBe(false);
      expect(isValidEmail('test example.com')).toBe(false);
    });

    it('should handle emails with whitespace after sanitization', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
      expect(isValidEmail('Test@Example.COM')).toBe(true);
    });

    it('should return false for empty or null input', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail(null as unknown as string)).toBe(false);
      expect(isValidEmail(undefined as unknown as string)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(isValidEmail(123 as unknown as string)).toBe(false);
    });
  });

  describe('validateEmail', () => {
    it('should return valid result for valid email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should sanitize email before validation', () => {
      const result = validateEmail('  Test@Example.COM  ');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return error for empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('邮箱不能为空');
    });

    it('should return error for whitespace-only email', () => {
      const result = validateEmail('   ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('邮箱不能为空');
    });

    it('should return error for invalid email format', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('邮箱格式不正确');
    });

    it('should return error for null or undefined', () => {
      const result1 = validateEmail(null as unknown as string);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe('邮箱不能为空');

      const result2 = validateEmail(undefined as unknown as string);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe('邮箱不能为空');
    });

    it('should return error for non-string input', () => {
      const result = validateEmail(123 as unknown as string);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('邮箱不能为空');
    });
  });
});
