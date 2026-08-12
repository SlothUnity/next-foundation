import { describe, expect, it } from 'vitest';

import { resolveRoute } from './resolveRoute';

describe('resolveRoute', () => {
  const locales = ['pt-PT', 'en-GB', 'fr-FR'];

  it('uses the default locale when there is no locale segment', () => {
    expect(
      resolveRoute({
        segments: ['sobre-nos'],
        locales,
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
      }),
    ).toEqual({
      locale: 'pt-PT',
      path: '',
    });
  });

  it('returns undefined when the site has no locales', () => {
    expect(
      resolveRoute({
        segments: ['about'],
        locales: [],
      }),
    ).toBeUndefined();
  });
});
