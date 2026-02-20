// Mocks must be declared before imports
jest.mock('jsdom', () => ({
  JSDOM: jest.fn().mockImplementation(() => ({ window: {} }))
}));

jest.mock('dompurify', () => {
  const mockSanitize = jest.fn((text) => {
    if (!text) return '';
    return String(text).replace(/<[^>]+>/g, '');
  });
  
  return jest.fn().mockReturnValue({
    sanitize: mockSanitize
  });
});

import { sanitizeText, sanitizeFeedbackContent } from './sanitize';
import DOMPurify from 'dompurify';

describe('Sanitization Utils', () => {
  let sanitizeSpy: jest.Mock;

  beforeAll(() => {
    // DOMPurify is the mock factory function
    // It was called once when sanitize.ts was imported
    const mockFactory = DOMPurify as unknown as jest.Mock;
    const purifyInstance = mockFactory.mock.results[0].value;
    sanitizeSpy = purifyInstance.sanitize;
  });

  beforeEach(() => {
    sanitizeSpy.mockClear();
  });

  describe('sanitizeText', () => {
    it('should call DOMPurify and normalize whitespace', () => {
      const input = '  Hello   <b>World</b>  ';
      
      const output = sanitizeText(input);
      
      expect(sanitizeSpy).toHaveBeenCalledWith(input, expect.objectContaining({
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: [],
          KEEP_CONTENT: true
      }));
      expect(output).toBe('Hello World');
    });

    it('should handle empty strings', () => {
      expect(sanitizeText('')).toBe('');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeText(null as unknown as string)).toBe('');
      expect(sanitizeText(undefined as unknown as string)).toBe('');
    });
  });

  describe('sanitizeFeedbackContent', () => {
    it('should sanitize all string fields', () => {
      const input = {
        occupation: '<b>Developer</b>',
        learningPurpose: ['<script>Work</script>', 'Travel'],
        fragmentTimeHelpful: 'yes',
        fragmentTimeNotHelpfulReason: '<i>Reason</i>',
        willRecommend: 'no',
        notRecommendReason: '<u>Bad</u>',
        openFeedback: '<p>Feedback</p>',
      };

      const output = sanitizeFeedbackContent(input);

      expect(output.occupation).toBe('Developer');
      expect(output.learningPurpose).toEqual(['Work', 'Travel']);
      expect(output.fragmentTimeHelpful).toBe('yes');
      expect(output.fragmentTimeNotHelpfulReason).toBe('Reason');
      expect(output.willRecommend).toBe('no');
      expect(output.notRecommendReason).toBe('Bad');
      expect(output.openFeedback).toBe('Feedback');
    });

    it('should filter empty strings from array', () => {
        const input = {
            learningPurpose: ['Valid', '<script></script>', '  '],
        };
        const output = sanitizeFeedbackContent(input);
        expect(output.learningPurpose).toEqual(['Valid']);
    });

    it('should handle missing optional fields', () => {
        const input = {
          occupation: 'Developer',
        };
        const output = sanitizeFeedbackContent(input);
        expect(output.occupation).toBe('Developer');
        expect(output.openFeedback).toBeUndefined();
    });
  });
});
