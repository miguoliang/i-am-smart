import {
  sanitizePhone,
  isValidPhone,
  validatePhone,
  formatPhoneForSupabase,
} from "./phoneValidation";

describe("phoneValidation", () => {
  describe("sanitizePhone", () => {
    it("should trim whitespace from phone", () => {
      expect(sanitizePhone("  13800138000  ")).toBe("13800138000");
      expect(sanitizePhone("\t13800138000\n")).toBe("13800138000");
    });

    it("should remove spaces, dashes, and parentheses", () => {
      expect(sanitizePhone("138 0013 8000")).toBe("13800138000");
      expect(sanitizePhone("138-0013-8000")).toBe("13800138000");
      expect(sanitizePhone("(138)00138000")).toBe("13800138000");
    });

    it("should strip +86 prefix", () => {
      expect(sanitizePhone("+8613800138000")).toBe("13800138000");
      expect(sanitizePhone("+86 138 0013 8000")).toBe("13800138000");
    });

    it("should strip 86 prefix for 13-digit numbers", () => {
      expect(sanitizePhone("8613800138000")).toBe("13800138000");
    });

    it("should not strip 86 for non-13-digit numbers", () => {
      expect(sanitizePhone("861234")).toBe("861234");
    });

    it("should handle empty string", () => {
      expect(sanitizePhone("")).toBe("");
      expect(sanitizePhone("   ")).toBe("");
    });

    it("should handle non-string input", () => {
      expect(sanitizePhone(null as unknown as string)).toBe("");
      expect(sanitizePhone(undefined as unknown as string)).toBe("");
      expect(sanitizePhone(123 as unknown as string)).toBe("");
    });
  });

  describe("isValidPhone", () => {
    it("should return true for valid Chinese mobile numbers", () => {
      expect(isValidPhone("13800138000")).toBe(true);
      expect(isValidPhone("15912345678")).toBe(true);
      expect(isValidPhone("18612345678")).toBe(true);
      expect(isValidPhone("17012345678")).toBe(true);
      expect(isValidPhone("19912345678")).toBe(true);
    });

    it("should return true for numbers with +86 prefix after sanitization", () => {
      expect(isValidPhone("+8613800138000")).toBe(true);
    });

    it("should return false for invalid phone numbers", () => {
      expect(isValidPhone("12345678901")).toBe(false); // starts with 1 but second digit is 2
      expect(isValidPhone("1234567890")).toBe(false); // too short
      expect(isValidPhone("138001380001")).toBe(false); // too long
      expect(isValidPhone("23800138000")).toBe(false); // doesn't start with 1
      expect(isValidPhone("abcdefghijk")).toBe(false); // letters
    });

    it("should return false for empty or null input", () => {
      expect(isValidPhone("")).toBe(false);
      expect(isValidPhone(null as unknown as string)).toBe(false);
      expect(isValidPhone(undefined as unknown as string)).toBe(false);
    });

    it("should return false for non-string input", () => {
      expect(isValidPhone(123 as unknown as string)).toBe(false);
    });
  });

  describe("validatePhone", () => {
    it("should return valid result for valid phone", () => {
      const result = validatePhone("13800138000");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should sanitize phone before validation", () => {
      const result = validatePhone("+86 138 0013 8000");
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should return error for empty phone", () => {
      const result = validatePhone("");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("手机号不能为空");
    });

    it("should return error for whitespace-only phone", () => {
      const result = validatePhone("   ");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("手机号不能为空");
    });

    it("should return error for invalid phone format", () => {
      const result = validatePhone("12345");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("手机号格式不正确");
    });

    it("should return error for null or undefined", () => {
      const result1 = validatePhone(null as unknown as string);
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBe("手机号不能为空");

      const result2 = validatePhone(undefined as unknown as string);
      expect(result2.isValid).toBe(false);
      expect(result2.error).toBe("手机号不能为空");
    });
  });

  describe("formatPhoneForSupabase", () => {
    it("should add +86 prefix to sanitized phone", () => {
      expect(formatPhoneForSupabase("13800138000")).toBe("+8613800138000");
    });

    it("should handle phone with existing +86 prefix", () => {
      expect(formatPhoneForSupabase("+8613800138000")).toBe("+8613800138000");
    });

    it("should handle phone with spaces", () => {
      expect(formatPhoneForSupabase("138 0013 8000")).toBe("+8613800138000");
    });
  });
});
