import { cn, urlBase64ToUint8Array } from './utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names', () => {
      expect(cn('a', false && 'b', 'c')).toBe('a c');
    });
  });

  describe('urlBase64ToUint8Array', () => {
    it('decodes base64url to bytes', () => {
      const input = btoa('hello').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const out = urlBase64ToUint8Array(input);
      expect(Array.from(out)).toEqual([104, 101, 108, 108, 111]);
    });
  });
});
