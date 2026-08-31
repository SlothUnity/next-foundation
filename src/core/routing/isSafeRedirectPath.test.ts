import { describe, expect, it } from 'vitest';

import { isSafeRedirectPath } from './isSafeRedirectPath';

describe('isSafeRedirectPath', () => {
  it('accepts a path on our own origin', () => {
    expect(isSafeRedirectPath('/sobre-nos')).toBe(true);
  });

  it('accepts the root', () => {
    expect(isSafeRedirectPath('/')).toBe(true);
  });

  it('accepts a localised path with a query string', () => {
    expect(isSafeRedirectPath('/en/about-us?preview=1')).toBe(true);
  });

  it('rejects a protocol-relative url', () => {
    expect(isSafeRedirectPath('//sitemau.com')).toBe(false);
  });

  it('rejects a backslash that browsers normalise to a protocol-relative url', () => {
    expect(isSafeRedirectPath('/\\sitemau.com')).toBe(false);
  });

  it('rejects a mixed slash and backslash', () => {
    expect(isSafeRedirectPath('/\\/sitemau.com')).toBe(false);
  });

  it('rejects an absolute url', () => {
    expect(isSafeRedirectPath('https://sitemau.com')).toBe(false);
  });

  it('rejects a path that does not start with a slash', () => {
    expect(isSafeRedirectPath('sobre-nos')).toBe(false);
  });

  it('rejects nothing at all', () => {
    expect(isSafeRedirectPath(null)).toBe(false);
    expect(isSafeRedirectPath(undefined)).toBe(false);
    expect(isSafeRedirectPath('')).toBe(false);
  });
});
