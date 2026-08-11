import { describe, expect, it } from 'vitest';

import { createPagePath } from './createPagePath';

describe('createPagePath', () => {
  it('does not prefix the default locale', () => {
    expect(
      createPagePath({
        slug: 'sobre-nos',
        locale: 'pt-PT',
        defaultLocale: 'pt-PT',
      }),
    ).toBe('/sobre-nos');
  });

  it('prefixes a non-default locale', () => {
    expect(
      createPagePath({
        slug: 'about-us',
        locale: 'en-GB',
        defaultLocale: 'pt-PT',
      }),
    ).toBe('/en/about-us');
  });

  it('returns root for an empty slug in the default locale', () => {
    expect(
      createPagePath({
        slug: '',
        locale: 'pt-PT',
        defaultLocale: 'pt-PT',
      }),
    ).toBe('/');
  });

  it('returns the locale root for an empty slug in another locale', () => {
    expect(
      createPagePath({
        slug: '',
        locale: 'en-GB',
        defaultLocale: 'pt-PT',
      }),
    ).toBe('/en');
  });
});
