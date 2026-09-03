import { describe, expect, it } from 'vitest';

import { resolveRoute } from './resolveRoute';

describe('resolveRoute', () => {
  const locales = ['pt-PT', 'en-GB', 'fr-FR'];
  const defaultLocale = 'pt-PT';

  it('uses the default locale when there is no locale segment', () => {
    expect(
      resolveRoute({
        segments: ['sobre-nos'],
        locales,
        defaultLocale,
      }),
    ).toEqual({
      locale: 'pt-PT',
      path: 'sobre-nos',
    });
  });

  it('resolves a prefixed locale', () => {
    expect(
      resolveRoute({
        segments: ['en', 'about-us'],
        locales,
        defaultLocale,
      }),
    ).toEqual({
      locale: 'en-GB',
      path: 'about-us',
    });
  });

  it('resolves nested paths', () => {
    expect(
      resolveRoute({
        segments: ['en', 'company', 'team'],
        locales,
        defaultLocale,
      }),
    ).toEqual({
      locale: 'en-GB',
      path: 'company/team',
    });
  });

  it('uses the default locale for an empty route', () => {
    expect(
      resolveRoute({
        segments: [],
        locales,
        defaultLocale,
      }),
    ).toEqual({
      locale: 'pt-PT',
      path: '',
    });
  });

  it('still resolves when the site declares no locales', () => {
    expect(
      resolveRoute({
        segments: ['about'],
        locales: [],
        defaultLocale,
      }),
    ).toEqual({
      locale: 'pt-PT',
      path: 'about',
    });
  });

  it('does not treat a locale segment as a locale when the site does not serve it', () => {
    expect(
      resolveRoute({
        segments: ['de', 'ueber-uns'],
        locales,
        defaultLocale,
      }),
    ).toEqual({
      locale: 'pt-PT',
      path: 'de/ueber-uns',
    });
  });
});
