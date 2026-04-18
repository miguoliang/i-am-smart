import type { PostgrestError } from '@supabase/supabase-js';
import { handleRepositoryError, isNotFoundError } from './error-handling';

describe('error-handling', () => {
  describe('handleRepositoryError', () => {
    it('throws with operation and message when error set', () => {
      const err = { message: 'boom' } as PostgrestError;
      expect(() => handleRepositoryError(err, 'Op')).toThrow('Op error: boom');
    });

    it('throws unknown when error null', () => {
      expect(() => handleRepositoryError(null, 'Op')).toThrow('Op error: Unknown error occurred');
    });
  });

  describe('isNotFoundError', () => {
    it('returns false for null', () => {
      expect(isNotFoundError(null)).toBe(false);
    });

    it('detects PGRST116', () => {
      expect(isNotFoundError({ code: 'PGRST116', message: '' } as PostgrestError)).toBe(true);
    });

    it('detects no rows message', () => {
      expect(
        isNotFoundError({ code: 'other', message: 'No rows returned' } as PostgrestError)
      ).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isNotFoundError({ code: 'xx', message: 'other' } as PostgrestError)).toBe(false);
    });
  });
});
