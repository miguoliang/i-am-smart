import {
  assertIsArray,
  assertIsNumber,
  assertIsObject,
  assertIsString,
  validateUserStats,
} from './validation';

describe('repository validation', () => {
  describe('assertIsObject', () => {
    it('returns object for plain objects', () => {
      expect(assertIsObject({ a: 1 }, 'x')).toEqual({ a: 1 });
    });

    it('throws for null, array, primitives', () => {
      expect(() => assertIsObject(null, 'f')).toThrow(/must be an object/);
      expect(() => assertIsObject([], 'f')).toThrow(/must be an object/);
      expect(() => assertIsObject('s', 'f')).toThrow(/must be an object/);
    });
  });

  describe('assertIsString', () => {
    it('returns string', () => {
      expect(assertIsString('a', 'f')).toBe('a');
    });

    it('throws otherwise', () => {
      expect(() => assertIsString(1, 'f')).toThrow(/must be a string/);
    });
  });

  describe('assertIsNumber', () => {
    it('returns finite numbers', () => {
      expect(assertIsNumber(0, 'f')).toBe(0);
    });

    it('throws for NaN or non-number', () => {
      expect(() => assertIsNumber(NaN, 'f')).toThrow(/must be a number/);
      expect(() => assertIsNumber('1', 'f')).toThrow(/must be a number/);
    });
  });

  describe('assertIsArray', () => {
    it('returns arrays', () => {
      expect(assertIsArray<number>([1], 'f')).toEqual([1]);
    });

    it('throws for non-array', () => {
      expect(() => assertIsArray({}, 'f')).toThrow(/must be an array/);
    });
  });

  describe('validateUserStats', () => {
    it('parses valid stats', () => {
      expect(
        validateUserStats({
          total: 1,
          mastered: 0,
          learning: 1,
          dueToday: 0,
        })
      ).toEqual({ total: 1, mastered: 0, learning: 1, dueToday: 0 });
    });

    it('throws when fields invalid', () => {
      expect(() => validateUserStats({})).toThrow();
    });
  });
});
