import { resolveShareLandingUrl } from './shareLandingUrl';

describe('resolveShareLandingUrl', () => {
  let savedSite: string | undefined;
  let savedAppOrigin: string | undefined;

  beforeEach(() => {
    savedSite = process.env.NEXT_PUBLIC_SITE_URL;
    savedAppOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN;
    delete process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_APP_ORIGIN;
  });

  afterEach(() => {
    if (savedSite !== undefined) process.env.NEXT_PUBLIC_SITE_URL = savedSite;
    else delete process.env.NEXT_PUBLIC_SITE_URL;
    if (savedAppOrigin !== undefined) process.env.NEXT_PUBLIC_APP_ORIGIN = savedAppOrigin;
    else delete process.env.NEXT_PUBLIC_APP_ORIGIN;
  });

  it('uses NEXT_PUBLIC_SITE_URL and strips trailing slash', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://example.com/';
    expect(resolveShareLandingUrl()).toBe('https://example.com');
  });

  it('falls back to NEXT_PUBLIC_APP_ORIGIN', () => {
    process.env.NEXT_PUBLIC_APP_ORIGIN = 'https://app.example/';
    expect(resolveShareLandingUrl()).toBe('https://app.example');
  });
});
