import { afterEach, describe, expect, it, vi } from 'vitest';

import { redirectTarget } from './redirectTarget';

afterEach(() => {
  vi.restoreAllMocks();
});

function refuse(to: string): string {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

  redirectTarget(to);

  return String(warn.mock.calls[0]?.[0] ?? '');
}

describe('redirectTarget', () => {
  it.each(['/sobre-nos', '/en/about-us', '/', '/a/b/c'])('passes %s through', (to) => {
    expect(redirectTarget(to)).toBe(to);
  });

  it.each([
    'https://sitemau.com',
    '//sitemau.com',
    '/\\sitemau.com',
    'sobre-nos',
    'javascript:alert(1)',
    '',
    null,
    undefined,
  ])('refuses %s, because a redirect leaves this site with it', (to) => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(redirectTarget(to)).toBeUndefined();
  });

  it('names the value it refused, so the provider that produced it can be found', () => {
    expect(refuse('https://sitemau.com')).toContain('https://sitemau.com');
  });

  it('says what it did instead, because the visitor gets a page either way', () => {
    expect(refuse('//sitemau.com')).toContain('not-found');
  });
});
