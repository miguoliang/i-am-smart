import { getErrorMessage, hasErrorMessage, isError } from './errorUtils';

describe('errorUtils', () => {
  describe('isError', () => {
    it('returns true for Error instances', () => {
      expect(isError(new Error('x'))).toBe(true);
    });

    it('returns false for non-errors', () => {
      expect(isError('err')).toBe(false);
      expect(isError(null)).toBe(false);
      expect(isError({ message: 'x' })).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('reads Error.message', () => {
      expect(getErrorMessage(new Error('hello'))).toBe('hello');
    });

    it('returns plain strings', () => {
      expect(getErrorMessage('plain')).toBe('plain');
    });

    it('reads message from object with string message', () => {
      expect(getErrorMessage({ message: 'from object' })).toBe('from object');
    });

    it('falls back for unknown shapes', () => {
      expect(getErrorMessage({ message: 1 })).toBe('未知错误');
      expect(getErrorMessage(undefined)).toBe('未知错误');
    });
  });

  describe('hasErrorMessage', () => {
    it('compares normalized message', () => {
      expect(hasErrorMessage(new Error('a'), 'a')).toBe(true);
      expect(hasErrorMessage(new Error('a'), 'b')).toBe(false);
    });
  });
});
